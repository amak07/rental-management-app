# NextAuth Configuration Deep Dive

## 🎛️ Understanding NextAuth.js Architecture

NextAuth.js is built around several core concepts that work together to provide authentication:

### Core Components

```mermaid
graph TD
    A[User Request] --> B[NextAuth API Route]
    B --> C[Configuration Object]
    C --> D[Database Adapter]
    C --> E[Authentication Providers]
    C --> F[Session Strategy]
    C --> G[Callbacks]
    
    D --> H[(Database)]
    E --> I[Credentials Provider]
    E --> J[OAuth Providers]
    F --> K[Database Sessions]
    F --> L[JWT Sessions]
    G --> M[Session Callback]
    G --> N[JWT Callback]
```

## 🔧 Configuration Object Breakdown

### 1. Database Adapter

```typescript
adapter: PrismaAdapter(prisma)
```

**What it does:**
- Connects NextAuth to your database via Prisma
- Translates NextAuth operations into database queries
- Manages User, Account, Session, and VerificationToken tables

**Adapter Methods (automatically called by NextAuth):**
```typescript
// When user signs up
await adapter.createUser({
  email: "user@example.com",
  name: "John Doe"
})

// When user signs in
await adapter.createSession({
  userId: "user123",
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  sessionToken: "random-secure-token"
})

// When OAuth account is linked
await adapter.linkAccount({
  userId: "user123",
  provider: "google",
  providerAccountId: "google-user-id",
  type: "oauth",
  access_token: "ya29.a0AfH6SMC..."
})
```

### 2. Session Configuration

```typescript
session: {
  strategy: 'database',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // 1 day
}
```

#### Database vs JWT Sessions

| Feature | Database Sessions | JWT Sessions |
|---------|------------------|--------------|
| **Storage** | Database + Cookie ID | All data in cookie/token |
| **Revocation** | Immediate (delete from DB) | Must wait for expiration |
| **Database Load** | 1 query per request | No database queries |
| **Scalability** | Requires shared database | Fully stateless |
| **Security** | More secure (server-controlled) | Risk if token compromised |
| **Use Case** | Sensitive apps, multi-tenant | Microservices, high scale |

**Why we chose database sessions:**
- **Immediate revocation**: Critical for rental app security
- **User management**: Landlords can see active tenant sessions
- **Compliance**: GDPR requires ability to delete all user data
- **Audit trail**: Track login patterns for security

### 3. Authentication Providers

#### Credentials Provider Deep Dive

```typescript
CredentialsProvider({
  id: 'credentials',
  name: 'Email and Password',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' }
  },
  async authorize(credentials) {
    // Custom authentication logic here
  }
})
```

**The authorize() function is critical:**

```typescript
async authorize(credentials) {
  // 1. Input validation
  if (!credentials?.email || !credentials?.password) {
    return null // NEVER throw errors - they leak info
  }

  // 2. Find user in database
  const user = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      password: true, // Only select when needed
      role: true,
      emailVerified: true
    }
  })

  // 3. Verify password
  if (!user || !user.password) {
    return null
  }

  const isValid = await verifyPassword(credentials.password, user.password)
  if (!isValid) {
    return null
  }

  // 4. Return user object (WITHOUT password)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified
  }
}
```

**Security principles:**
- **Never throw errors**: Return null for any failure
- **Normalize input**: Convert email to lowercase
- **Time-constant comparison**: Use bcrypt.compare()
- **Don't leak info**: Same response for "user not found" vs "wrong password"

### 4. Callbacks - The Heart of Customization

Callbacks allow you to customize the authentication flow:

#### Session Callback

```typescript
async session({ session, user, token }) {
  // Called on every request that checks authentication
  // Add custom data to session object
  
  if (session.user && user) {
    session.user.id = user.id        // Add user ID
    session.user.role = user.role    // Add user role
  }
  
  return session
}
```

**When it runs:**
- Every call to `getSession()`
- Every call to `useSession()`
- Every request to `/api/auth/session`
- Every server-side authentication check

**Performance note:** This runs frequently, so keep it fast!

#### JWT Callback

```typescript
async jwt({ token, user, account }) {
  // Called when JWT is created or updated
  
  if (user) {
    // Initial sign in - add user data to token
    token.role = user.role
    token.id = user.id
  }
  
  return token
}
```

**When it runs:**
- User signs in (initial token creation)
- Token refresh (if using JWT sessions)
- Account linking

#### Sign In Callback

```typescript
async signIn({ user, account, profile }) {
  // Control whether user is allowed to sign in
  
  // Check email verification
  if (account?.provider === 'credentials') {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { emailVerified: true }
    })
    
    // Require verified email for password logins
    if (!dbUser?.emailVerified) {
      return false // Block sign in
    }
  }
  
  return true // Allow sign in
}
```

**Use cases:**
- Email verification requirements
- Account suspension checks
- Terms of service acceptance
- Custom business logic

## 🛡️ Security Features

### 1. CSRF Protection

NextAuth provides automatic CSRF protection:

```typescript
// GET /api/auth/csrf returns token
{
  "csrfToken": "abc123def456"
}

// All POST requests must include this token
// NextAuth forms include it automatically
```

### 2. Secure Cookies

```typescript
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,    // JavaScript can't access
      sameSite: 'lax',   // CSRF protection
      path: '/',         // Available site-wide
      secure: process.env.NODE_ENV === 'production' // HTTPS only
    }
  }
}
```

**Cookie attributes explained:**
- **httpOnly**: Prevents XSS attacks (JavaScript can't read cookie)
- **sameSite**: Prevents CSRF attacks (cookie not sent on cross-site requests)
- **secure**: HTTPS-only transmission (prevents man-in-the-middle)
- **path**: Where cookie is available

### 3. Secret Management

```typescript
secret: process.env.NEXTAUTH_SECRET
```

**Used for:**
- Signing JWT tokens
- Encrypting session cookies
- CSRF token generation

**Requirements:**
- Long random string (32+ characters)
- Different for each environment
- Never commit to version control

## 🔗 API Route Handler

The `[...nextauth]/route.ts` file creates all authentication endpoints:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Routes created:**
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signin` - Process sign in
- `GET /api/auth/signout` - Sign out page
- `POST /api/auth/signout` - Process sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token
- `GET /api/auth/providers` - List providers
- `POST /api/auth/callback/*` - OAuth callbacks

## 🎯 Real-World Usage Examples

### 1. Server-Side Authentication

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// In API routes
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Check role-based permissions
  if (session.user.role !== 'LANDLORD') {
    return new Response('Forbidden', { status: 403 })
  }
  
  // User is authenticated and authorized
  return Response.json({ data: 'sensitive data' })
}

// In page components
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

### 2. Client-Side Authentication

```typescript
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function LoginButton() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <p>Loading...</p>
  }
  
  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <p>Role: {session.user.role}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  
  return (
    <div>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </div>
  )
}
```

### 3. Middleware Protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional logic here
    console.log('Authenticated user:', req.nextauth.token?.email)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }
        
        // Protect landlord routes
        if (req.nextUrl.pathname.startsWith('/landlord')) {
          return token?.role === 'LANDLORD' || token?.role === 'ADMIN'
        }
        
        // Other routes just need authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/landlord/:path*']
}
```

## 🚀 Environment Variables

Create `.env` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-32-characters-minimum

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rental_app"

# OAuth Providers (add when needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🧪 Testing the Configuration

### 1. Database Connection Test

```typescript
// Test that Prisma adapter can connect
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'

const adapter = PrismaAdapter(prisma)

// Test user creation
const testUser = await adapter.createUser({
  email: 'test@example.com',
  name: 'Test User'
})

console.log('User created:', testUser)
```

### 2. Password Hashing Test

```typescript
import { hashPassword, verifyPassword } from '@/lib/password'

const password = 'TestPassword123!'
const hash = await hashPassword(password)
const isValid = await verifyPassword(password, hash)

console.log('Hash:', hash)
console.log('Verification:', isValid) // Should be true
```

### 3. Auth Flow Test

```typescript
// Test the authorize function
const credentials = {
  email: 'test@example.com',
  password: 'TestPassword123!'
}

const result = await authOptions.providers[0].authorize(credentials)
console.log('Auth result:', result)
```

## 🔍 Common Issues & Debugging

### 1. "NEXTAUTH_SECRET not found" Error

```bash
# Make sure .env.local exists with:
NEXTAUTH_SECRET=your-secret-here
```

### 2. Database Connection Issues

```typescript
// Test Prisma connection
await prisma.$connect()
console.log('Database connected!')
```

### 3. Session Not Persisting

Check cookie settings:
- `httpOnly: true` - Required for security
- `secure: true` - Only in production with HTTPS
- `sameSite: 'lax'` - Allows some cross-site usage

### 4. TypeScript Errors

Make sure type declarations are included:

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'TENANT' | 'LANDLORD' | 'ADMIN'
      // ... other fields
    }
  }
}
```

## 📚 Key Takeaways

1. **Configuration Object**: Central place for all auth settings
2. **Database Adapter**: Connects NextAuth to your database
3. **Providers**: Define how users authenticate (credentials, OAuth)
4. **Callbacks**: Customize behavior and add data to sessions
5. **Security**: Built-in CSRF protection, secure cookies, secret management
6. **API Routes**: Catch-all route handles all auth endpoints
7. **Type Safety**: Extend NextAuth types for custom fields

---

**Next:** [API Routes & Authentication Flow](./05-api-routes-and-flow.md)