/**
 * Password Security Utilities
 * 
 * This module handles secure password operations for our authentication system.
 * We use bcryptjs for hashing passwords before storing them in the database.
 * 
 * Security Principles:
 * 1. Never store plain text passwords
 * 2. Use strong hashing algorithms (bcrypt)
 * 3. Implement time-constant comparisons
 * 4. Use appropriate salt rounds for performance vs security
 */

import bcrypt from 'bcryptjs'

/**
 * Number of salt rounds for bcrypt hashing
 * 
 * Why 12 rounds?
 * - 10 rounds: ~10ms (too fast, vulnerable to brute force)
 * - 12 rounds: ~150ms (good balance for 2024)
 * - 14 rounds: ~2400ms (too slow for user experience)
 * 
 * Rule of thumb: Should take ~100-300ms on your server
 * As computers get faster, increase this number
 */
const SALT_ROUNDS = 12

/**
 * Hashes a plain text password using bcrypt
 * 
 * How bcrypt works:
 * 1. Generates a random salt (prevents rainbow table attacks)
 * 2. Combines password + salt
 * 3. Applies bcrypt algorithm with specified rounds
 * 4. Returns hash containing: algorithm + rounds + salt + hash
 * 
 * Example output: "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"
 *                  ^   ^  ^                                                    ^
 *                  |   |  |                                                    |
 *               algo rounds salt (22 chars)                            hash (31 chars)
 * 
 * @param password - Plain text password to hash
 * @returns Promise that resolves to hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Input validation
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    
    return hashedPassword
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verifies a plain text password against a hashed password
 * 
 * How verification works:
 * 1. Extracts salt and rounds from stored hash
 * 2. Hashes the provided password with same salt/rounds
 * 3. Compares results using time-constant comparison
 * 
 * Time-constant comparison prevents timing attacks:
 * - Always takes same amount of time regardless of where strings differ
 * - Prevents attackers from learning info about hash through timing
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hash from database
 * @returns Promise that resolves to true if password matches
 * @throws Error if verification fails
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Input validation
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string')
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string')
    }

    // Verify the password using time-constant comparison
    const isValid = await bcrypt.compare(password, hashedPassword)
    
    return isValid
  } catch (error) {
    // Security: Don't reveal whether the error was with password or hash
    throw new Error('Password verification failed')
  }
}

/**
 * Utility function to check if a password needs rehashing
 * 
 * When to rehash:
 * - Salt rounds have increased (security upgrade)
 * - Algorithm has been upgraded
 * - Hash format is outdated
 * 
 * This allows you to gradually upgrade password security:
 * 1. User logs in successfully
 * 2. Check if hash needs upgrade
 * 3. If yes, rehash with new settings and update database
 * 
 * @param hashedPassword - Current hash from database
 * @returns true if password should be rehashed
 */
export function shouldRehashPassword(hashedPassword: string): boolean {
  try {
    // Extract current rounds from hash
    const rounds = bcrypt.getRounds(hashedPassword)
    
    // Rehash if current rounds are less than desired
    return rounds < SALT_ROUNDS
  } catch (error) {
    // If we can't parse the hash, it definitely needs rehashing
    return true
  }
}

/**
 * Generates a cryptographically secure random password
 * 
 * Useful for:
 * - Temporary passwords
 * - Initial admin passwords
 * - Password reset tokens
 * 
 * @param length - Length of password to generate (default: 16)
 * @returns Randomly generated password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

/**
 * Validates password strength
 * 
 * Requirements for our rental app:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 * 
 * @param password - Password to validate
 * @returns Object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 72) {
    errors.push('Password must be 72 characters or less')
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