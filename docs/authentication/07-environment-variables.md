# Environment Variables & Security Configuration

## 🔧 Environment File Strategy

For our rental management app, we use `.env` for local development (instead of the typical `.env.local`). This simplifies our development workflow while maintaining security.

### File Structure
```
.env.example    # Template with all variables and documentation
.env           # Local development (ignored by git)
.env.production # Production environment (managed by hosting platform)
```

## 🛡️ Required Environment Variables

### 1. NextAuth.js Configuration

```bash
# NextAuth URL - The canonical URL of your site
NEXTAUTH_URL=http://localhost:3000

# NextAuth Secret - Used to encrypt JWT tokens and session cookies
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
```

**NEXTAUTH_URL Explained:**
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Used for**: OAuth redirects, API route generation, session validation

**NEXTAUTH_SECRET Explained:**
- **Purpose**: Encrypts session cookies and signs JWT tokens
- **Requirements**: 32+ characters, cryptographically random
- **Security**: MUST be different for each environment
- **Rotation**: Change regularly, especially if compromised

### 2. Database Configuration

```bash
# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/rental_management_dev"
```

**Format Breakdown:**
```
postgresql://[username]:[password]@[host]:[port]/[database]?[options]
```

**Examples by Environment:**
```bash
# Local Development
DATABASE_URL="postgresql://postgres:password@localhost:5432/rental_management_dev"

# Neon (Production)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/rental_management_prod"

# Supabase (Alternative)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### 3. OAuth Provider Configuration (Future)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-app-secret
```

## 🚀 Setting Up Local Environment

### Step 1: Copy Example File

```bash
# Copy the example file to create your local environment
cp .env.example .env
```

### Step 2: Generate NextAuth Secret

```bash
# Generate a secure random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 3: Configure Database

```bash
# Update .env with your database credentials
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/rental_management_dev"
```

### Step 4: Verify Configuration

```bash
# Test database connection
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

## 🔐 Security Best Practices

### 1. Environment-Specific Secrets

```bash
# ❌ BAD: Same secret across environments
NEXTAUTH_SECRET=same-secret-everywhere

# ✅ GOOD: Different secrets per environment
# Development
NEXTAUTH_SECRET=dev-secret-random-32-chars...

# Production  
NEXTAUTH_SECRET=prod-secret-different-32-chars...
```

### 2. Secret Rotation Strategy

```bash
# Rotate secrets regularly:
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update environment variable
# 3. Deploy application
# 4. Monitor for session invalidation (expected)
# 5. Users will need to re-login (expected)
```

### 3. Database Security

```bash
# ✅ GOOD: Strong database credentials
DATABASE_URL="postgresql://rental_app_user:StrongP@ssw0rd123!@localhost:5432/rental_management_dev"

# ❌ BAD: Weak/default credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/rental_management_dev"
```

## 🌍 Environment-Specific Configuration

### Development (.env)

```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-32-chars-minimum
DATABASE_URL="postgresql://postgres:password@localhost:5432/rental_management_dev"
DEBUG=true
```

### Production (Hosting Platform)

```bash
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=prod-secret-different-from-dev
DATABASE_URL="postgresql://user:pass@production-host:5432/rental_management_prod"
DEBUG=false
```

## 📋 Environment Variable Validation

Create a validation utility to ensure all required variables are present:

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Database
  DATABASE_URL: z.string().startsWith('postgresql://'),
  
  // Optional OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env)

// Usage in your app:
// import { env } from '@/lib/env'
// console.log(env.NEXTAUTH_SECRET) // Type-safe!
```

## 🏗️ Hosting Platform Configuration

### AWS Amplify

```bash
# In Amplify Console → Environment Variables
NEXTAUTH_URL=https://your-app.amplifyapp.com
NEXTAUTH_SECRET=your-production-secret
DATABASE_URL=your-neon-connection-string
```

### Vercel

```bash
# Using Vercel CLI
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production

# Or in Vercel Dashboard → Settings → Environment Variables
```

### Railway

```bash
# Using Railway CLI
railway env set NEXTAUTH_SECRET=your-secret
railway env set DATABASE_URL=your-db-url

# Or in Railway Dashboard → Variables
```

## 🔍 Environment Variable Debugging

### 1. Check if Variables are Loaded

```typescript
// In your NextAuth config or API route
console.log('Environment check:', {
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  hasUrl: !!process.env.NEXTAUTH_URL,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV
})
```

### 2. Common Issues & Solutions

```bash
# Issue: "NEXTAUTH_SECRET not found"
# Solution: Make sure .env file exists and is in project root

# Issue: "Database connection failed" 
# Solution: Check DATABASE_URL format and database is running

# Issue: "Callback URL mismatch" with OAuth
# Solution: Update NEXTAUTH_URL to match your domain

# Issue: Environment variables not updating
# Solution: Restart development server after changing .env
```

### 3. Runtime Environment Check

```typescript
// src/lib/config-check.ts
export function validateEnvironment() {
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'DATABASE_URL'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  console.log('✅ All required environment variables are present')
}

// Call in your app startup:
validateEnvironment()
```

## 🚨 Security Warnings

### 1. Never Commit Secrets

```bash
# ✅ GOOD: .env is in .gitignore
.env
.env.local
.env.production

# ❌ BAD: Committing secrets to version control
git add .env # DON'T DO THIS!
```

### 2. Use Secret Management in Production

```bash
# ✅ GOOD: Use platform secret managers
# AWS: Systems Manager Parameter Store
# Vercel: Environment Variables (encrypted)
# Railway: Environment Variables (encrypted)

# ❌ BAD: Hardcoding secrets in deployment scripts
NEXTAUTH_SECRET=hardcoded-secret-in-dockerfile
```

### 3. Audit Secret Access

```typescript
// Log when secrets are accessed (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Accessing NEXTAUTH_SECRET at:', new Date().toISOString())
}
```

## 📖 Environment Variable Reference

### Core Variables (Required)

| Variable | Purpose | Example | Notes |
|----------|---------|---------|-------|
| `NEXTAUTH_URL` | Canonical site URL | `http://localhost:3000` | Must match actual URL |
| `NEXTAUTH_SECRET` | Token/cookie encryption | `32-char-random-string` | Rotate regularly |
| `DATABASE_URL` | Database connection | `postgresql://...` | Include all connection params |

### OAuth Variables (Optional)

| Variable | Purpose | Example | Notes |
|----------|---------|---------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth app ID | `xxx.apps.googleusercontent.com` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-xxx` | Keep secret |
| `GITHUB_ID` | GitHub OAuth app ID | `Iv1.xxx` | From GitHub Settings |
| `GITHUB_SECRET` | GitHub OAuth secret | `xxx` | Keep secret |

### Application Variables (Optional)

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `NODE_ENV` | Environment mode | `development` | Affects logging, security |
| `DEBUG` | Enable debug logs | `false` | Only in development |
| `PORT` | Server port | `3000` | For local development |

## 🧪 Testing Environment Configuration

```typescript
// Create a test file to verify your environment
// src/lib/__tests__/env.test.ts

describe('Environment Configuration', () => {
  test('should have all required variables', () => {
    expect(process.env.NEXTAUTH_URL).toBeDefined()
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
    expect(process.env.DATABASE_URL).toBeDefined()
  })
  
  test('NEXTAUTH_SECRET should be secure', () => {
    const secret = process.env.NEXTAUTH_SECRET!
    expect(secret.length).toBeGreaterThanOrEqual(32)
    expect(secret).not.toBe('your-secret-here') // Not example value
  })
  
  test('DATABASE_URL should be valid PostgreSQL URL', () => {
    const url = process.env.DATABASE_URL!
    expect(url).toMatch(/^postgresql:\/\//)
  })
})
```

## 📝 Key Takeaways

1. **Use `.env` for local development** (not `.env.local`)
2. **Generate secure secrets** with `openssl rand -base64 32`
3. **Different secrets per environment** (dev, staging, prod)
4. **Validate environment variables** at startup
5. **Never commit secrets** to version control
6. **Use platform secret managers** in production
7. **Rotate secrets regularly** for security
8. **Test environment configuration** with automated tests

---

**Next:** [Testing & Debugging](./08-testing-and-debugging.md)