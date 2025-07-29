# Security Concepts & Password Hashing

## 🔐 Why Password Utilities?

### NextAuth.js vs Custom Password Handling

NextAuth.js is designed to be flexible and doesn't include password utilities because:

**NextAuth.js provides:**
- OAuth handling (Google, GitHub, etc.)
- Session management  
- CSRF protection
- Database adapters

**NextAuth.js does NOT provide:**
- Password hashing utilities
- Password validation
- User registration logic
- Password strength checking

**Why this separation?** Many apps use OAuth-only (no passwords), others have custom password requirements, and some integrate with existing systems.

### The Problem with Simple Solutions

```typescript
// ❌ NEVER DO THIS - Plain text storage
const user = { password: "myPassword123" } 
// Problem: Anyone with DB access sees passwords

// ❌ NEVER DO THIS - Simple hashing  
const user = { password: crypto.createHash('sha256').update("myPassword123").digest('hex') }
// Problem: Vulnerable to rainbow table attacks

// ✅ CORRECT - bcrypt with salt
const user = { password: await bcrypt.hash("myPassword123", 12) }
// Result: "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"
```

## 🧂 Understanding Salts

### The Rainbow Table Problem

**Without Salts:**
```
Common passwords → Pre-computed hashes (Rainbow Tables)
"password123" → "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
"123456"      → "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
"qwerty"      → "65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5"
```

If someone steals your database:
1. They look up each hash in pre-computed rainbow table
2. Instantly discover passwords for millions of users
3. Game over 💀

### The Salt Solution

**Salt = Random data added to password before hashing**

```typescript
// User 1 enters "password123"
const salt1 = "k2J9mNpQ8rT5"
const hash1 = hash("password123" + salt1) // Unique result

// User 2 enters same "password123" 
const salt2 = "X7vB3nL1qW9e"  // Different random salt
const hash2 = hash("password123" + salt2) // Completely different result!

// Rainbow tables become useless because:
// - Same password → Different hashes (due to different salts)
// - Attacker would need rainbow table for every possible salt
// - With good salts, this becomes computationally impossible
```

### How bcrypt Handles Salts Automatically

```typescript
const password = "myPassword123"
const hashedPassword = await bcrypt.hash(password, 12)
// Result: "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"
//          ^   ^  ^                          ^
//          |   |  |                          |
//       algo rounds    salt (built-in)    actual hash

// The salt is embedded in the result!
// bcrypt automatically:
// 1. Generates random salt
// 2. Combines with password  
// 3. Hashes the combination
// 4. Stores algorithm + rounds + salt + hash in one string
```

**During verification:**
```typescript
const isValid = await bcrypt.compare("myPassword123", hashedPassword)
// bcrypt automatically:
// 1. Extracts salt from stored hash
// 2. Combines input password with extracted salt
// 3. Hashes the combination
// 4. Compares with stored hash portion
```

## 🛡️ bcrypt Security Features

### Salt Rounds (Work Factor)

```typescript
const SALT_ROUNDS = 12

// What this means:
// - Algorithm runs 2^12 = 4,096 iterations
// - Each iteration makes hashing slower
// - Slower hashing = harder to brute force
```

**Choosing Salt Rounds:**

| Rounds | Time (2024) | Security Level |
|--------|-------------|----------------|
| 10     | ~10ms       | Too fast, vulnerable |
| 12     | ~150ms      | Good for 2024 ✅ |
| 14     | ~2400ms     | Very secure but slow UX |
| 16     | ~38s        | Overkill for most apps |

**Rule of thumb:** Should take 100-300ms on your server

### Time-Constant Comparison

```typescript
// ❌ BAD: Vulnerable to timing attacks
function comparePasswords(password1: string, password2: string): boolean {
  return password1 === password2
  // Problem: Fails faster when first characters differ
  // Attacker can measure response time to learn about password
}

// ✅ GOOD: bcrypt uses time-constant comparison
const isValid = await bcrypt.compare(password, hashedPassword)
// Always takes same time regardless of where passwords differ
```

## 🏗️ Why Create Utility Functions?

### 1. Centralized Security Logic

```typescript
// ❌ BAD: Scattered throughout codebase
// register.ts
const hash = await bcrypt.hash(password, 10) // 10 rounds

// reset-password.ts  
const hash = await bcrypt.hash(newPassword, 12) // 12 rounds - inconsistent!

// admin.ts
const hash = await bcrypt.hash(adminPassword, 8) // 8 rounds - weak!

// ✅ GOOD: Centralized in lib/password.ts
import { hashPassword } from '@/lib/password'
const hash = await hashPassword(password) // Always uses correct settings
```

### 2. Input Validation & Error Handling

```typescript
// ❌ BAD: No validation
const hash = await bcrypt.hash(null, 12) // Runtime error!
const hash = await bcrypt.hash("", 12)   // Empty password!

// ✅ GOOD: Validates input
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  
  if (password.length > 72) {
    // bcrypt has a 72 character limit
    throw new Error('Password must be 72 characters or less')
  }

  return await bcrypt.hash(password, SALT_ROUNDS)
}
```

### 3. Future-Proofing

```typescript
// Later, if you need to upgrade security:
const SALT_ROUNDS = 14 // Increase from 12

// Or switch algorithms entirely:
// import argon2 from 'argon2'
// return await argon2.hash(password)

// All your code automatically uses new settings!
```

### 4. Password Strength Validation

```typescript
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## 🎯 Real-World Implementation

### User Registration Flow

```typescript
// 1. User submits registration form
const { email, password } = await request.json()

// 2. Validate password strength
const validation = validatePasswordStrength(password)
if (!validation.isValid) {
  return NextResponse.json({ 
    error: 'Weak password', 
    details: validation.errors 
  }, { status: 400 })
}

// 3. Hash password securely
const hashedPassword = await hashPassword(password)

// 4. Store in database (never store plain text!)
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword
  }
})
```

### User Login Flow

```typescript
// 1. User submits login form
const { email, password } = await request.json()

// 2. Find user in database
const user = await prisma.user.findUnique({
  where: { email },
  select: { 
    id: true, 
    email: true, 
    password: true,
    role: true
  }
})

if (!user || !user.password) {
  throw new Error('Invalid credentials')
}

// 3. Verify password
const isValid = await verifyPassword(password, user.password)
if (!isValid) {
  throw new Error('Invalid credentials')
}

// 4. Check if password needs rehashing (security upgrade)
if (shouldRehashPassword(user.password)) {
  const newHash = await hashPassword(password)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHash }
  })
}

// 5. Create session (NextAuth handles this part)
```

## 🚨 Security Best Practices

### 1. Never Log Passwords

```typescript
// ❌ BAD: Password in logs
console.log('User login attempt:', { email, password })

// ✅ GOOD: Only log non-sensitive data
console.log('User login attempt:', { email, timestamp: new Date() })
```

### 2. Rate Limiting

```typescript
// Prevent brute force attacks
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

// Track failed attempts per IP/email
const failedAttempts = await redis.get(`login_attempts:${email}`)
if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
  throw new Error('Account temporarily locked due to too many failed attempts')
}
```

### 3. Secure Error Messages

```typescript
// ❌ BAD: Reveals information
if (!user) {
  throw new Error('User not found')
}
if (!await verifyPassword(password, user.password)) {
  throw new Error('Invalid password')
}

// ✅ GOOD: Generic error message
if (!user || !await verifyPassword(password, user.password)) {
  throw new Error('Invalid email or password')
}
```

## 📊 Password Security Checklist

- [x] **Hashing**: Use bcrypt with appropriate rounds (12+)
- [x] **Salting**: Automatic with bcrypt
- [x] **Validation**: Enforce strong password requirements
- [x] **Input validation**: Check for empty/invalid inputs
- [x] **Error handling**: Generic error messages
- [x] **Rate limiting**: Prevent brute force attacks
- [x] **Secure storage**: Never store plain text
- [x] **Logging**: Never log passwords or hashes
- [x] **Rehashing**: Upgrade security when possible

## 🧪 Testing Password Security

```typescript
// Test password hashing
const password = "TestPassword123!"
const hash = await hashPassword(password)
const isValid = await verifyPassword(password, hash)
console.log('Password verification:', isValid) // Should be true

// Test password strength
const validation = validatePasswordStrength("weak")
console.log('Validation errors:', validation.errors)

// Test timing (should be ~150ms for 12 rounds)
const start = Date.now()
await hashPassword("test")
const duration = Date.now() - start
console.log('Hashing time:', duration + 'ms')
```

---

**Next:** [NextAuth Configuration Deep Dive](./03-nextauth-configuration.md)