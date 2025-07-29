# TypeScript Integration & Module Augmentation

## 🎯 Understanding Module Augmentation

NextAuth.js provides basic TypeScript types, but they don't know about our custom fields like `role`. Module augmentation allows us to extend existing types with our application-specific data.

### The Problem Without Type Extensions

```typescript
// Without module augmentation:
const session = await getSession()
console.log(session.user.role) // ❌ TypeScript error: Property 'role' does not exist
```

### The Solution With Module Augmentation

```typescript
// With our type extensions:
const session = await getSession()
console.log(session.user.role) // ✅ TypeScript knows about 'role' property
```

## 📋 Our Type Extension Strategy

### 1. Create Base Types (`src/types/auth.ts`)

```typescript
/**
 * User Roles - matches Prisma schema exactly
 */
export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN'

/**
 * Extended User Type
 * Adds our custom fields to NextAuth's default User
 */
export interface ExtendedUser extends DefaultUser {
  role: UserRole
  emailVerified?: Date | null
}

/**
 * Extended Session Type  
 * Defines what's available when calling getSession()
 */
export interface ExtendedSession extends DefaultSession {
  user: {
    id: string           // Add user ID
    email: string
    name?: string | null
    image?: string | null
    role: UserRole       // Add our custom role field
    emailVerified?: Date | null
  }
}
```

### 2. Module Augmentation

```typescript
/**
 * This tells TypeScript to replace NextAuth's default types
 * with our extended versions throughout the entire application
 */
declare module 'next-auth' {
  interface Session extends ExtendedSession {}
  interface User extends ExtendedUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends ExtendedJWT {}
}
```

## 🔧 How Module Augmentation Works

### Before Augmentation
```typescript
// NextAuth's default types (simplified)
declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null  
      image?: string | null
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}
```

### After Our Augmentation
```typescript
// Our extended types replace the defaults
declare module 'next-auth' {
  interface Session {
    user: {
      id: string              // ✅ Now includes ID
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole          // ✅ Now includes role
      emailVerified?: Date | null // ✅ Now includes verification status
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole          // ✅ Now includes role
    emailVerified?: Date | null // ✅ Now includes verification status
  }
}
```

## 🎨 Type-Safe Usage Examples

### 1. Server-Side Usage

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // ✅ TypeScript knows these properties exist
  console.log(session.user.id)    // string
  console.log(session.user.role)  // 'TENANT' | 'LANDLORD' | 'ADMIN'
  console.log(session.user.email) // string
  
  // ✅ Type-safe role checking
  if (session.user.role === 'ADMIN') {
    // Admin-only logic
    return Response.json({ adminData: 'secret' })
  }
  
  return Response.json({ message: 'Hello user!' })
}
```

### 2. Client-Side Usage

```typescript
'use client'
import { useSession } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  // ✅ All properties are type-safe
  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>ID: {session.user.id}</p>
      {session.user.emailVerified ? (
        <p>✅ Email verified</p>
      ) : (
        <p>❌ Email not verified</p>
      )}
    </div>
  )
}
```

### 3. Middleware Usage

```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // ✅ TypeScript knows about our custom JWT fields
    console.log(token?.role) // 'TENANT' | 'LANDLORD' | 'ADMIN'
    console.log(token?.id)   // string
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // ✅ Type-safe authorization logic
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }
        
        return !!token
      }
    }
  }
)
```

## 🛡️ Type Guards for Runtime Safety

While TypeScript provides compile-time safety, we also need runtime checks:

```typescript
/**
 * Type guard to check if user has required role
 */
export function hasRole(
  user: ExtendedUser | ExtendedSession['user'], 
  role: UserRole
): boolean {
  return user.role === role
}

/**
 * Type guard to check if user is admin
 */
export function isAdmin(user: ExtendedUser | ExtendedSession['user']): boolean {
  return user.role === 'ADMIN'
}

/**
 * Type guard to check if session is valid
 */
export function isAuthenticated(session: ExtendedSession | null): session is ExtendedSession {
  return session !== null && session.user !== undefined
}

// Usage examples:
const session = await getSession()

if (isAuthenticated(session)) {
  // TypeScript now knows session is not null
  console.log(session.user.email) // ✅ Safe to access
  
  if (isAdmin(session.user)) {
    // TypeScript knows user is admin
    console.log('User is admin')
  }
}
```

## 🔄 Keeping Types in Sync

### 1. Prisma Schema → TypeScript Types

Our auth types should match our Prisma schema:

```prisma
// prisma/schema.prisma
enum UserRole {
  TENANT
  LANDLORD  
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole  @default(TENANT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

```typescript
// src/types/auth.ts - Keep this in sync!
export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN'

export interface ExtendedUser extends DefaultUser {
  role: UserRole
  emailVerified?: Date | null
  // Don't include password, createdAt, updatedAt in auth types
}
```

### 2. Using Prisma-Generated Types

For perfect sync, you can use Prisma's generated types:

```typescript
import type { User, UserRole } from '@prisma/client'

// Use Prisma's exact types
export type { UserRole } from '@prisma/client'

// Create auth-specific type from Prisma User
export interface ExtendedUser extends Omit<User, 'password' | 'createdAt' | 'updatedAt'> {
  // Prisma User type, but exclude sensitive/unnecessary fields
}
```

## 🧪 Testing Type Safety

### 1. Compile-Time Tests

Create a test file to verify your types work:

```typescript
// src/types/__tests__/auth.test-types.ts
import type { ExtendedSession, ExtendedUser, UserRole } from '../auth'

// Test that our types have required properties
const testSession: ExtendedSession = {
  user: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'TENANT',
    emailVerified: new Date()
  },
  expires: '2024-01-01'
}

// Test that role assignments work
const testRoles: UserRole[] = ['TENANT', 'LANDLORD', 'ADMIN']

// This should cause a TypeScript error if roles don't match:
// const badRole: UserRole = 'INVALID' // ❌ Should error

// Test type guards
import { isAdmin, hasRole } from '../auth'

const user = testSession.user
const isUserAdmin: boolean = isAdmin(user)
const hasLandlordRole: boolean = hasRole(user, 'LANDLORD')
```

### 2. Runtime Type Validation

Use Zod for runtime validation that matches your TypeScript types:

```typescript
import { z } from 'zod'

// Zod schema that matches our TypeScript types
export const UserRoleSchema = z.enum(['TENANT', 'LANDLORD', 'ADMIN'])

export const ExtendedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: UserRoleSchema,
  emailVerified: z.date().nullable()
})

// Use in API routes for validation
export async function POST(request: Request) {
  const body = await request.json()
  
  // Runtime validation that matches our TypeScript types
  const validatedUser = ExtendedUserSchema.parse(body)
  
  // Now TypeScript knows validatedUser matches ExtendedUser type
  console.log(validatedUser.role) // Type-safe!
}
```

## 🔍 Common TypeScript Issues & Solutions

### 1. "Property does not exist" Errors

```typescript
// ❌ Error: Property 'role' does not exist on type 'User'
const session = await getSession()
console.log(session.user.role)

// ✅ Solution: Make sure your module augmentation is imported
// Add this to your layout.tsx or _app.tsx:
import '@/types/auth'
```

### 2. Type Mismatch in Callbacks

```typescript
// NextAuth configuration
callbacks: {
  async session({ session, user }) {
    // ❌ TypeScript might complain about assigning to session.user.id
    session.user.id = user.id
    session.user.role = user.role
    
    return session
  }
}

// ✅ Solution: Use type assertions carefully
callbacks: {
  async session({ session, user }) {
    if (session.user && user) {
      (session.user as any).id = user.id;
      (session.user as any).role = user.role
    }
    
    return session
  }
}
```

### 3. Missing Types in Development

```typescript
// ❌ If types aren't working in development:

// ✅ Solutions:
// 1. Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
// 2. Make sure types are imported in your main files
// 3. Check tsconfig.json includes your types directory
```

## 📚 Best Practices

### 1. **Keep Types Close to Usage**
```typescript
// ✅ GOOD: Define types in dedicated auth types file
// src/types/auth.ts

// ❌ BAD: Scatter type definitions across many files
```

### 2. **Use Consistent Naming**
```typescript
// ✅ GOOD: Consistent "Extended" prefix
interface ExtendedUser extends DefaultUser {}
interface ExtendedSession extends DefaultSession {}
interface ExtendedJWT extends DefaultJWT {}

// ❌ BAD: Inconsistent naming
interface CustomUser extends DefaultUser {}
interface MySession extends DefaultSession {}
interface AppJWT extends DefaultJWT {}
```

### 3. **Document Complex Types**
```typescript
/**
 * Extended Session Type
 * 
 * This interface defines what data is available when calling getSession()
 * or useSession(). It extends NextAuth's default session with our custom
 * fields like user role and email verification status.
 * 
 * @example
 * const session = await getSession()
 * if (session) {
 *   console.log(session.user.role) // 'TENANT' | 'LANDLORD' | 'ADMIN'
 * }
 */
export interface ExtendedSession extends DefaultSession {
  // ... type definition
}
```

### 4. **Validate at Boundaries**
```typescript
// ✅ GOOD: Validate data coming from external sources
export async function createUser(data: unknown) {
  const validatedData = ExtendedUserSchema.parse(data)
  return await prisma.user.create({ data: validatedData })
}

// ❌ BAD: Trust external data without validation
export async function createUser(data: ExtendedUser) {
  return await prisma.user.create({ data })
}
```

## 🎯 Key Takeaways

1. **Module Augmentation**: Extends existing types with your custom fields
2. **Type Safety**: Catches errors at compile time, not runtime
3. **Consistency**: Keep TypeScript types in sync with Prisma schema
4. **Runtime Validation**: Use Zod for runtime type checking
5. **Type Guards**: Provide both type safety and runtime checks
6. **Documentation**: Explain complex types for future developers

---

**Next:** [Environment Variables & Security](./07-environment-variables.md)