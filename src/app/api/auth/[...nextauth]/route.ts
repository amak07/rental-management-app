/**
 * NextAuth.js API Route Handler
 * 
 * This file creates the NextAuth.js API endpoints for authentication.
 * The [...nextauth] catch-all route handles all authentication-related requests.
 * 
 * Routes this file handles:
 * - GET  /api/auth/signin        - Display sign in page
 * - POST /api/auth/signin        - Handle sign in submission
 * - GET  /api/auth/signout       - Display sign out page  
 * - POST /api/auth/signout       - Handle sign out
 * - GET  /api/auth/session       - Get current session
 * - GET  /api/auth/csrf          - Get CSRF token
 * - GET  /api/auth/providers     - Get available providers
 * - POST /api/auth/callback/*    - Handle OAuth callbacks
 * 
 * How the catch-all route works:
 * - [...nextauth] creates a dynamic route that captures all paths under /api/auth/
 * - NextAuth.js receives the full path and HTTP method
 * - It routes internally to the appropriate handler
 * 
 * Security features handled by NextAuth:
 * - CSRF protection on all state-changing operations
 * - Secure session cookie generation and validation
 * - OAuth 2.0 flow implementation
 * - Proper redirect handling to prevent open redirects
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth.js Route Handler
 * 
 * In Next.js 13+ App Router, we export GET and POST handlers
 * instead of a default export. NextAuth provides a handler
 * function that works with both HTTP methods.
 * 
 * The handler function:
 * 1. Receives the HTTP request (GET, POST, etc.)
 * 2. Extracts the NextAuth action from the URL path
 * 3. Routes to the appropriate internal handler
 * 4. Returns the appropriate HTTP response
 */
const handler = NextAuth(authOptions)

/**
 * Export handlers for Next.js App Router
 * 
 * Next.js App Router requires separate exports for each HTTP method.
 * We use the same handler for both GET and POST since NextAuth
 * internally routes based on the request path and method.
 */
export { handler as GET, handler as POST }

/**
 * Request Flow Examples:
 * 
 * 1. User visits /api/auth/signin
 *    - GET request → handler → NextAuth displays sign-in page
 * 
 * 2. User submits login form
 *    - POST to /api/auth/signin → handler → NextAuth processes credentials
 *    - Success: Redirect to callback URL with session cookie
 *    - Failure: Redirect back to sign-in with error
 * 
 * 3. App checks user session
 *    - GET /api/auth/session → handler → NextAuth returns current session
 * 
 * 4. User signs out
 *    - POST /api/auth/signout → handler → NextAuth destroys session
 *    - Deletes session from database
 *    - Clear session cookie
 *    - Redirect to home page
 * 
 * 5. OAuth flow (Google login)
 *    - GET /api/auth/signin/google → Redirect to Google
 *    - Google redirects to /api/auth/callback/google
 *    - POST /api/auth/callback/google → NextAuth processes OAuth response
 *    - Creates/updates user and account records
 *    - Creates session and redirects to app
 */

/**
 * Environment Variables Required:
 * 
 * NEXTAUTH_URL=http://localhost:3000 (or your domain in production)
 * NEXTAUTH_SECRET=your-secret-key (long random string)
 * DATABASE_URL=postgresql://... (your database connection)
 * 
 * For OAuth providers (when we add them):
 * GOOGLE_CLIENT_ID=your-google-client-id
 * GOOGLE_CLIENT_SECRET=your-google-client-secret
 */

/**
 * CSRF Protection:
 * 
 * NextAuth automatically provides CSRF protection:
 * 1. GET /api/auth/csrf returns a token
 * 2. All state-changing requests must include this token
 * 3. Token is automatically included in NextAuth's built-in forms
 * 4. Custom forms must include the CSRF token
 * 
 * Example of getting CSRF token:
 * const csrfToken = await getCsrfToken()
 */