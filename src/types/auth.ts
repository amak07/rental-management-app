/**
 * Authentication Type Definitions
 * 
 * This file extends NextAuth.js types to include our custom fields
 * and provides type safety for our authentication system.
 * 
 * TypeScript Module Augmentation:
 * NextAuth.js provides default types, but they don't know about our
 * custom fields like 'role'. We use module augmentation to extend
 * the default types with our application-specific data.
 */

import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

/**
 * User Roles Enumeration
 * 
 * Define the possible user roles in our rental management system.
 * This should match the UserRole enum in our Prisma schema.
 */
export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN'

/**
 * Extended User Type
 * 
 * Adds our custom fields to the base User type.
 * This is used during authentication and user creation.
 */
export interface ExtendedUser extends DefaultUser {
  role: UserRole
  emailVerified?: Date | null
}

/**
 * Extended Session Type
 * 
 * Defines what data is available in the user session.
 * This is what you get when calling getSession() or useSession().
 */
export interface ExtendedSession extends DefaultSession {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    emailVerified?: Date | null
  }
}

/**
 * Extended JWT Type
 * 
 * Defines what data is stored in the JWT token.
 * With database sessions, this is mainly used internally by NextAuth.
 */
export interface ExtendedJWT extends DefaultJWT {
  role: UserRole
  id: string
}

/**
 * Module Augmentation for NextAuth
 * 
 * This tells TypeScript that NextAuth's default types should be
 * replaced with our extended types throughout the application.
 */
declare module 'next-auth' {
  /**
   * Session Interface
   * 
   * Used when calling:
   * - getSession()
   * - useSession()
   * - getServerSession()
   */
  interface Session extends ExtendedSession {}

  /**
   * User Interface
   * 
   * Used when:
   * - User object is passed to callbacks
   * - Creating/updating users
   * - Returning from authorize() function
   */
  interface User extends ExtendedUser {}
}

/**
 * Module Augmentation for NextAuth JWT
 * 
 * Extends the JWT token type for cases where JWT is used.
 */
declare module 'next-auth/jwt' {
  /**
   * JWT Interface
   * 
   * Used in:
   * - JWT callback
   * - Middleware authentication
   * - Token-based operations
   */
  interface JWT extends ExtendedJWT {}
}

/**
 * Authentication Error Types
 * 
 * Define specific error types for better error handling.
 */
export type AuthError = 
  | 'CredentialsSignin'    // Invalid email/password
  | 'SessionRequired'      // Protected route accessed without session
  | 'AccessDenied'         // User lacks required permissions
  | 'Verification'         // Email verification required
  | 'Configuration'        // NextAuth configuration error

/**
 * Authentication Provider Types
 * 
 * Define the types of authentication providers we support.
 */
export type AuthProvider = 'credentials' | 'google' | 'github'

/**
 * Login Credentials Type
 * 
 * Type for the login form data.
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Registration Data Type
 * 
 * Type for the registration form data.
 */
export interface RegisterData {
  email: string
  password: string
  name: string
  role?: UserRole // Optional, defaults to TENANT
}

/**
 * Password Validation Result Type
 * 
 * Type for password strength validation results.
 */
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

/**
 * Authorization Helper Types
 * 
 * Types for role-based access control.
 */
export interface RolePermissions {
  TENANT: string[]
  LANDLORD: string[]
  ADMIN: string[]
}

/**
 * Session Status Types
 * 
 * Possible states of a user session.
 */
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * OAuth Account Data Type
 * 
 * Type for OAuth account information from providers.
 */
export interface OAuthAccountData {
  provider: string
  providerAccountId: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
}

/**
 * User Profile Update Type
 * 
 * Type for updating user profile information.
 */
export interface UserProfileUpdate {
  name?: string
  image?: string
  // Add other updatable fields as needed
}

/**
 * Authentication Context Type
 * 
 * Type for the authentication context provider.
 */
export interface AuthContextType {
  session: ExtendedSession | null
  status: SessionStatus
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: UserProfileUpdate) => Promise<void>
}

/**
 * Protected Route Props Type
 * 
 * Props for components that require authentication.
 */
export interface ProtectedRouteProps {
  requiredRole?: UserRole
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Type Guards
 * 
 * Helper functions to check types at runtime.
 */

/**
 * Check if user has required role
 */
export function hasRole(user: ExtendedUser | ExtendedSession['user'] | null | undefined, role: UserRole): boolean {
  return user?.role === role
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: ExtendedUser | ExtendedSession['user'] | null | undefined): boolean {
  return user?.role === 'ADMIN'
}

/**
 * Check if user has landlord or admin role
 */
export function isLandlordOrAdmin(user: ExtendedUser | ExtendedSession['user'] | null | undefined): boolean {
  return user?.role === 'LANDLORD' || user?.role === 'ADMIN'
}

/**
 * Check if session is valid and user is authenticated
 */
export function isAuthenticated(session: ExtendedSession | null | undefined): session is ExtendedSession {
  return session !== null && session !== undefined && session.user !== undefined
}

/**
 * Utility Types for API Responses
 */

/**
 * Standard API Response Type
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Authentication API Response Type
 */
export interface AuthApiResponse extends ApiResponse {
  user?: ExtendedUser
  session?: ExtendedSession
}

// Types are already exported above, no need to re-export