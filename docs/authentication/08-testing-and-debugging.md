# Testing & Debugging Authentication

## 🧪 Testing Our NextAuth.js Implementation

Now that we've configured NextAuth.js, let's test our implementation systematically and learn how to debug common issues.

## 🚀 Quick Setup Test

### 1. Environment Check

First, let's verify our environment is set up correctly:

```bash
# Check if all files are created
ls -la src/lib/auth.ts
ls -la src/lib/password.ts  
ls -la src/app/api/auth/[...nextauth]/route.ts
ls -la .env

# Verify Prisma client is generated
npx prisma generate

# Check database connection
npx prisma db push
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test NextAuth.js Endpoints

Visit these URLs in your browser:

```
http://localhost:3000/api/auth/providers
http://localhost:3000/api/auth/csrf
http://localhost:3000/api/auth/session
http://localhost:3000/api/auth/signin
```

**Expected Results:**
- `/providers` - JSON showing available providers
- `/csrf` - JSON with CSRF token
- `/session` - JSON with null (no active session)
- `/signin` - NextAuth's default sign-in page

## 🔍 Database Testing

### 1. Check Database Tables

```bash
# Open Prisma Studio to view tables
npx prisma studio

# Or use SQL directly
psql -d rental_management_dev -c "\\dt"
```

**Expected Tables:**
- `users`
- `accounts` 
- `sessions`
- `verification_tokens`

### 2. Test User Creation

Create a test user directly in the database:

```sql
-- Connect to your database
psql -d rental_management_dev

-- Create a test user
INSERT INTO users (id, email, name, role, "emailVerified") 
VALUES ('test-user-1', 'test@example.com', 'Test User', 'TENANT', NOW());

-- Verify it was created
SELECT * FROM users WHERE email = 'test@example.com';
```

### 3. Test Password Utilities

Create a test script to verify password hashing:

```typescript
// scripts/test-auth.ts
import { hashPassword, verifyPassword, validatePasswordStrength } from '../src/lib/password'

async function testPasswordUtilities() {
  console.log('🧪 Testing Password Utilities\n')
  
  // Test password strength validation
  console.log('1. Testing password validation:')
  const weakPassword = 'weak'
  const strongPassword = 'StrongP@ssw0rd123!'
  
  const weakValidation = validatePasswordStrength(weakPassword)
  const strongValidation = validatePasswordStrength(strongPassword)
  
  console.log(`Weak password "${weakPassword}":`, weakValidation)
  console.log(`Strong password "${strongPassword}":`, strongValidation)
  
  // Test password hashing and verification
  console.log('\n2. Testing password hashing:')
  const testPassword = 'TestP@ssw0rd123!'
  
  console.time('Password hashing')
  const hashedPassword = await hashPassword(testPassword)
  console.timeEnd('Password hashing')
  
  console.log('Original:', testPassword)
  console.log('Hashed:', hashedPassword)
  
  // Test verification
  console.log('\n3. Testing password verification:')
  const validPassword = await verifyPassword(testPassword, hashedPassword)
  const invalidPassword = await verifyPassword('WrongPassword', hashedPassword)
  
  console.log('Correct password verification:', validPassword) // Should be true
  console.log('Incorrect password verification:', invalidPassword) // Should be false
  
  console.log('\n✅ Password utilities test completed!')
}

testPasswordUtilities().catch(console.error)
```

Run the test:

```bash
npx tsx scripts/test-auth.ts
```

## 🔐 Authentication Flow Testing

### 1. Test User Registration Flow

Create a test user with our authentication system:

```typescript
// scripts/test-registration.ts
import prisma from '../src/lib/prisma'
import { hashPassword } from '../src/lib/password'

async function testUserRegistration() {
  console.log('🧪 Testing User Registration\n')
  
  const testUser = {
    email: 'newuser@example.com',
    password: 'NewUserP@ssw0rd123!',
    name: 'New Test User',
    role: 'TENANT' as const
  }
  
  try {
    // 1. Hash the password
    const hashedPassword = await hashPassword(testUser.password)
    console.log('✅ Password hashed successfully')
    
    // 2. Create user in database
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        password: hashedPassword,
        role: testUser.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
        // Don't select password for security
      }
    })
    
    console.log('✅ User created in database:', user)
    
    // 3. Verify user can be found
    const foundUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true // Need for verification
      }
    })
    
    if (foundUser) {
      console.log('✅ User found in database')
      
      // 4. Verify password
      const { verifyPassword } = await import('../src/lib/password')
      const isValid = await verifyPassword(testUser.password, foundUser.password!)
      console.log('✅ Password verification:', isValid)
    }
    
  } catch (error) {
    console.error('❌ Registration test failed:', error)
  } finally {
    // Cleanup - remove test user
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    })
    console.log('🧹 Cleanup completed')
    await prisma.$disconnect()
  }
}

testUserRegistration()
```

### 2. Test NextAuth.js Integration

Test the complete authentication flow:

```typescript
// scripts/test-nextauth.ts
import { authOptions } from '../src/lib/auth'

async function testNextAuthIntegration() {
  console.log('🧪 Testing NextAuth.js Integration\n')
  
  // Test 1: Check configuration
  console.log('1. Checking NextAuth configuration:')
  console.log('- Adapter configured:', !!authOptions.adapter)
  console.log('- Session strategy:', authOptions.session?.strategy)
  console.log('- Providers count:', authOptions.providers.length)
  console.log('- Debug mode:', authOptions.debug)
  
  // Test 2: Check environment variables
  console.log('\n2. Checking environment variables:')
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
  console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing')
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing')
  
  // Test 3: Test credentials provider
  console.log('\n3. Testing credentials provider:')
  const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
  
  if (credentialsProvider && 'authorize' in credentialsProvider) {
    console.log('✅ Credentials provider found')
    
    // Test with invalid credentials (should return null)
    const invalidResult = await credentialsProvider.authorize({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }, {})
    
    console.log('Invalid credentials result:', invalidResult) // Should be null
  }
  
  console.log('\n✅ NextAuth integration test completed!')
}

testNextAuthIntegration()
```

## 🐛 Common Issues & Debugging

### 1. "NEXTAUTH_SECRET not found" Error

**Symptoms:**
```
Error: Please define a `NEXTAUTH_SECRET` environment variable
```

**Solutions:**
```bash
# Check if .env file exists
ls -la .env

# Generate a new secret
openssl rand -base64 32

# Add to .env file
echo "NEXTAUTH_SECRET=your-generated-secret-here" >> .env

# Restart development server
npm run dev
```

### 2. Database Connection Issues

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Debugging Steps:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo service postgresql status        # Linux

# Test connection directly
psql -d rental_management_dev -c "SELECT 1;"

# Check DATABASE_URL format
echo $DATABASE_URL
```

**Common URL Issues:**
```bash
# ❌ BAD: Missing quotes around special characters
DATABASE_URL=postgresql://user:p@ssw0rd@localhost:5432/db

# ✅ GOOD: Properly quoted
DATABASE_URL="postgresql://user:p%40ssw0rd@localhost:5432/db"
```

### 3. Prisma Schema Sync Issues

**Symptoms:**
```
Error: Schema drift detected
```

**Solutions:**
```bash
# Reset database and apply all migrations
npx prisma migrate reset

# Or push schema without migrations (development only)
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate
```

### 4. Session Not Persisting

**Symptoms:**
- User logs in successfully but session doesn't persist
- `getSession()` returns null immediately after login

**Debugging:**
```typescript
// Check session configuration
console.log('Session config:', {
  strategy: authOptions.session?.strategy,
  maxAge: authOptions.session?.maxAge,
  updateAge: authOptions.session?.updateAge
})

// Check database for session records
// In Prisma Studio or SQL:
SELECT * FROM sessions ORDER BY id DESC LIMIT 5;
```

**Common Causes:**
- Incorrect cookie settings (secure flag in development)
- NEXTAUTH_URL mismatch
- Database adapter not properly configured

### 5. TypeScript Type Errors

**Symptoms:**
```typescript
// Error: Property 'role' does not exist on type 'User'
console.log(session.user.role)
```

**Solutions:**
```typescript
// Make sure types are imported
import '@/types/auth'

// Or import explicitly in your component/page
import type { ExtendedSession } from '@/types/auth'

// Restart TypeScript server in VS Code
// Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 🔧 Debugging Tools & Techniques

### 1. Enable NextAuth Debug Mode

```typescript
// In src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... other config
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}
```

### 2. Database Query Logging

```typescript
// In src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
```

### 3. Session Debugging Utility

```typescript
// src/lib/debug-session.ts
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import prisma from './prisma'

export async function debugSession(req?: any) {
  console.log('\n🔍 Session Debug Information')
  
  // Get session
  const session = await getServerSession(authOptions)
  console.log('Session:', JSON.stringify(session, null, 2))
  
  if (session?.user) {
    // Check database for user
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        sessions: {
          select: {
            id: true,
            expires: true,
            sessionToken: true
          },
          take: 5
        }
      }
    })
    
    console.log('Database User:', JSON.stringify(dbUser, null, 2))
  }
  
  // Check environment
  console.log('Environment Check:', {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    hasSecret: !!process.env.NEXTAUTH_SECRET
  })
  
  console.log('🔍 Session Debug Complete\n')
}

// Usage in API routes:
// await debugSession(req)
```

### 4. Network Request Debugging

Use browser DevTools to inspect authentication requests:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Trigger authentication** (login attempt)
4. **Look for requests to `/api/auth/*`**

**Key requests to check:**
- `POST /api/auth/signin/credentials` - Login attempt
- `GET /api/auth/session` - Session retrieval
- `POST /api/auth/signout` - Logout

**Check for:**
- Response status codes (200 = success, 401 = unauthorized)
- Response body (error messages, user data)
- Request headers (cookies, CSRF tokens)
- Response headers (Set-Cookie)

## 📊 Testing Checklist

Before moving to production, verify:

### ✅ Environment Setup
- [ ] `.env` file exists with all required variables
- [ ] `NEXTAUTH_SECRET` is 32+ characters and unique
- [ ] `NEXTAUTH_URL` matches your development URL
- [ ] `DATABASE_URL` connects to correct database

### ✅ Database Setup
- [ ] All NextAuth tables exist (`users`, `accounts`, `sessions`, `verification_tokens`)
- [ ] Tables have correct schema and relationships
- [ ] Can create/read/update/delete users
- [ ] Foreign key constraints work correctly

### ✅ Authentication Flow
- [ ] Can visit `/api/auth/signin` without errors
- [ ] Can create users with hashed passwords
- [ ] Password verification works correctly
- [ ] Session creation and retrieval works
- [ ] Session persists across requests
- [ ] Logout destroys sessions properly

### ✅ Type Safety
- [ ] TypeScript recognizes custom session fields
- [ ] No TypeScript errors in authentication code
- [ ] Type guards work correctly
- [ ] Module augmentation is working

### ✅ Security
- [ ] Passwords are hashed, never stored in plain text
- [ ] Session tokens are secure and random
- [ ] CSRF protection is enabled
- [ ] Cookies have correct security flags
- [ ] No sensitive data in logs

## 🎯 Next Steps

Once authentication is working:

1. **Create authentication pages** (`/auth/signin`, `/auth/signup`)
2. **Add session provider** to your app layout  
3. **Implement protected routes** with middleware
4. **Add OAuth providers** (Google, GitHub)
5. **Create user management APIs**
6. **Add email verification** system

## 💡 Pro Tips

### 1. Use Prisma Studio for Database Inspection
```bash
npx prisma studio
```
Visual interface to inspect your database tables and data.

### 2. Keep Test Users for Development
Create test users with different roles for testing:

```sql
INSERT INTO users (id, email, name, role, password, "emailVerified") VALUES
('tenant-1', 'tenant@test.com', 'Test Tenant', 'TENANT', '$2a$12$...', NOW()),
('landlord-1', 'landlord@test.com', 'Test Landlord', 'LANDLORD', '$2a$12$...', NOW()),
('admin-1', 'admin@test.com', 'Test Admin', 'ADMIN', '$2a$12$...', NOW());
```

### 3. Create Development Utilities
Build helper functions for common development tasks:

```typescript
// src/lib/dev-utils.ts (development only)
export async function createTestUser(email: string, role: UserRole = 'TENANT') {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('createTestUser only available in development')
  }
  
  const password = await hashPassword('TestPassword123!')
  
  return await prisma.user.create({
    data: {
      email,
      name: `Test ${role}`,
      password,
      role,
      emailVerified: new Date()
    }
  })
}
```

---

**Congratulations!** 🎉 You now have a fully configured NextAuth.js authentication system with database sessions, password hashing, TypeScript integration, and comprehensive debugging capabilities.

The next step is to create authentication UI components and test the complete user authentication flow.