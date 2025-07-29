/**
 * NextAuth.js Configuration
 * 
 * This file configures NextAuth.js for our rental management application.
 * We use database sessions for better security and control in our multi-tenant system.
 * 
 * Key Design Decisions:
 * 1. Database sessions (not JWT) for immediate revocation capability
 * 2. Credentials provider for email/password authentication
 * 3. Prisma adapter for database integration
 * 4. Custom callbacks for role-based authorization
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { verifyPassword, shouldRehashPassword, hashPassword } from '@/lib/password'

/**
 * NextAuth.js Configuration Options
 * 
 * This configuration object defines how authentication works in our app.
 * Each option is explained with its purpose and security implications.
 */
export const authOptions: NextAuthOptions = {
  /**
   * Database Adapter Configuration
   * 
   * The PrismaAdapter connects NextAuth to our PostgreSQL database via Prisma.
   * 
   * What it does:
   * - Creates/updates User records during authentication
   * - Manages Session records for database sessions
   * - Handles Account records for OAuth providers
   * - Manages VerificationToken records for email verification
   * 
   * Why Prisma Adapter?
   * - Type-safe database operations
   * - Integrates with our existing Prisma schema
   * - Allows complex queries for admin features
   * - Full control over user data
   */
  adapter: PrismaAdapter(prisma),

  /**
   * Session Strategy Configuration
   * 
   * We use database sessions instead of JWT tokens for better security.
   */
  session: {
    /**
     * Session Strategy: "database" vs "jwt"
     * 
     * DATABASE SESSIONS (our choice):
     * - Session data stored in database
     * - Session ID stored in httpOnly cookie
     * - Can revoke sessions immediately (delete from database)
     * - Better for sensitive applications
     * - Requires database lookup on each request
     * 
     * JWT SESSIONS (alternative):
     * - All data encoded in token
     * - No database lookup needed
     * - Cannot revoke until expiration
     * - Better for stateless/distributed systems
     */
    strategy: 'database',

    /**
     * Session Max Age (30 days)
     * 
     * How long a session stays valid without activity.
     * 30 days = good balance between security and user experience.
     * 
     * Shorter = more secure but users need to login more often
     * Longer = better UX but higher security risk
     */
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds

    /**
     * Session Update Age (1 day)
     * 
     * How often session expiration is updated in database.
     * Every day = reduces database writes while keeping sessions fresh.
     */
    updateAge: 24 * 60 * 60, // 1 day in seconds
  },

  /**
   * Authentication Providers
   * 
   * Providers define how users can authenticate with our app.
   * We start with email/password and will add OAuth later.
   */
  providers: [
    /**
     * Credentials Provider - Email/Password Authentication
     * 
     * This provider handles traditional username/password login.
     * NextAuth doesn't provide this by default because it's complex
     * and requires custom logic for user verification.
     */
    CredentialsProvider({
      /**
       * Provider Configuration
       */
      id: 'credentials',
      name: 'Email and Password',
      
      /**
       * Credentials Form Definition
       * 
       * Defines the login form fields that NextAuth will display
       * on the default sign-in page.
       */
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your-email@example.com'
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Your password'
        }
      },

      /**
       * Authorization Function
       * 
       * This is the heart of credential-based authentication.
       * It receives the credentials from the login form and must:
       * 1. Validate the credentials
       * 2. Return user object if valid
       * 3. Return null if invalid
       * 
       * SECURITY NOTE: Never throw detailed errors here - they could
       * leak information to attackers. Always return null for any failure.
       */
      async authorize(credentials) {
        try {
          // Input validation
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing email or password in login attempt')
            return null
          }

          /**
           * Find User in Database
           * 
           * We look up the user by email and include the password hash
           * for verification. In other queries, we exclude the password
           * for security, but here we need it for authentication.
           */
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase() // Normalize email
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true, // Need this for password verification
              role: true,
              emailVerified: true,
              image: true
            }
          })

          // User not found
          if (!user) {
            console.log(`Login attempt for non-existent user: ${credentials.email}`)
            return null
          }

          // User exists but has no password (OAuth-only account)
          if (!user.password) {
            console.log(`Login attempt with password for OAuth-only user: ${credentials.email}`)
            return null
          }

          /**
           * Verify Password
           * 
           * Use our secure password verification utility.
           * This handles bcrypt comparison with time-constant timing.
           */
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${credentials.email}`)
            return null
          }

          /**
           * Password Rehashing (Security Upgrade)
           * 
           * If the password was hashed with older/weaker settings,
           * we rehash it with current settings during successful login.
           * This gradually upgrades security without forcing password resets.
           */
          if (shouldRehashPassword(user.password)) {
            console.log(`Rehashing password for user: ${credentials.email}`)
            try {
              const newHashedPassword = await hashPassword(credentials.password)
              await prisma.user.update({
                where: { id: user.id },
                data: { password: newHashedPassword }
              })
            } catch (error) {
              // Don't fail login if rehashing fails, just log it
              console.error('Failed to rehash password during login:', error)
            }
          }

          /**
           * Return User Object
           * 
           * This object will be available in session callbacks.
           * NEVER include the password hash in the returned object.
           */
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
            image: user.image,
          }

        } catch (error) {
          // Log error for debugging but don't expose details to client
          console.error('Authentication error:', error)
          return null
        }
      }
    })

    /**
     * Future OAuth Providers
     * 
     * We'll add these later:
     * 
     * GoogleProvider({
     *   clientId: process.env.GOOGLE_CLIENT_ID!,
     *   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
     * }),
     * 
     * GitHubProvider({
     *   clientId: process.env.GITHUB_ID!,
     *   clientSecret: process.env.GITHUB_SECRET!,
     * })
     */
  ],

  /**
   * Custom Pages
   * 
   * NextAuth provides default authentication pages, but we can
   * customize them to match our app's design and branding.
   */
  pages: {
    signIn: '/auth/signin',     // Custom sign-in page
    signUp: '/auth/signup',     // Custom sign-up page (will create later)
    error: '/auth/error',       // Custom error page
    // verifyRequest: '/auth/verify-request', // Email verification page
    // newUser: '/auth/new-user' // New user welcome page
  },

  /**
   * Callbacks
   * 
   * Callbacks are functions that are called during the authentication flow.
   * They allow us to customize behavior and add additional data to sessions.
   */
  callbacks: {
    /**
     * Session Callback
     * 
     * This callback is called whenever a session is checked.
     * It runs on every request to pages that use authentication.
     * 
     * Purpose:
     * - Add custom data to the session object
     * - Control what data is available to the client
     * - Implement role-based access control
     * 
     * Parameters:
     * - session: The session object that will be returned to client
     * - user: The user object from database (only available with database sessions)
     */
    async session({ session, user }) {
      /**
       * Add Custom User Data to Session
       * 
       * The default session only includes basic user info.
       * We add role and other custom fields for authorization.
       */
      if (session.user && user) {
        session.user.id = user.id
        session.user.role = user.role
        // Add other custom fields as needed:
        // session.user.companyId = user.companyId
        // session.user.permissions = user.permissions
      }

      return session
    },

    /**
     * JWT Callback
     * 
     * This callback is called when JWT tokens are created/updated.
     * Since we're using database sessions, this mainly runs during
     * the initial authentication flow.
     * 
     * Purpose:
     * - Add custom data to JWT during authentication
     * - Handle token refresh logic
     * 
     * Note: With database sessions, the JWT is mainly used internally
     * by NextAuth and not sent to the client.
     */
    async jwt({ token, user }) {
      // Add custom user data to token during initial authentication
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      return token
    },

    /**
     * Sign In Callback
     * 
     * This callback controls whether a user is allowed to sign in.
     * It's called after successful authentication but before session creation.
     * 
     * Purpose:
     * - Implement conditional access (e.g., email verification required)
     * - Block suspended/inactive users
     * - Implement custom business logic
     * 
     * Return true to allow sign in, false to block.
     */
    async signIn({ user, account, profile }) {
      try {
        /**
         * Email Verification Check
         * 
         * For credential-based logins, we might require email verification.
         * OAuth providers (Google, etc.) handle verification automatically.
         */
        if (account?.provider === 'credentials') {
          // Find the user in database to check verification status
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { emailVerified: true, role: true }
          })

          // Block unverified users (optional - you might allow this)
          // if (!dbUser?.emailVerified) {
          //   console.log(`Blocked login for unverified user: ${user.email}`)
          //   return false
          // }

          // Block suspended users (example of role-based blocking)
          // if (dbUser?.role === 'SUSPENDED') {
          //   console.log(`Blocked login for suspended user: ${user.email}`)
          //   return false
          // }
        }

        return true
      } catch (error) {
        console.error('Sign in callback error:', error)
        return false
      }
    }
  },

  /**
   * Events
   * 
   * Events are triggered during authentication flows.
   * They're useful for logging, analytics, and side effects.
   */
  events: {
    /**
     * Sign In Event
     * 
     * Triggered when user successfully signs in.
     * Good place for logging and analytics.
     */
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
      
      // Example: Track login analytics
      // await analytics.track('user_login', {
      //   userId: user.id,
      //   provider: account?.provider,
      //   isNewUser
      // })
    },

    /**
     * Sign Out Event
     * 
     * Triggered when user signs out.
     */
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email}`)
    }
  },

  /**
   * Debug Mode
   * 
   * Enable debug logging in development.
   * NEVER enable in production as it logs sensitive information.
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Security Configuration
   */
  
  /**
   * Secret for signing tokens and cookies
   * 
   * This should be a long, random string that's different for each environment.
   * NextAuth uses this to sign JWTs and encrypt session cookies.
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * Cookie Configuration
   * 
   * Configure how authentication cookies are handled.
   */
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,    // Cannot be accessed by client-side JavaScript
        sameSite: 'lax',   // CSRF protection
        path: '/',         // Available on all pages
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      }
    }
  }
}

/**
 * Type Declarations for Extended Session
 * 
 * These type declarations extend NextAuth's default types
 * to include our custom fields like 'role'.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'TENANT' | 'LANDLORD' | 'ADMIN'
      emailVerified?: Date | null
    }
  }

  interface User {
    role: 'TENANT' | 'LANDLORD' | 'ADMIN'
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'TENANT' | 'LANDLORD' | 'ADMIN'
    id: string
  }
}