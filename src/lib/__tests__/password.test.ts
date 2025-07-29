/**
 * Password Utilities Test Suite
 * 
 * Tests for password security functions including hashing, verification,
 * validation, and related security utilities.
 */

import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  shouldRehashPassword,
  generateSecurePassword
} from '@/lib/password'
import bcrypt from 'bcryptjs'

// Mock bcrypt for controlled testing  
jest.mock('bcryptjs')

// TypeScript has trouble with Jest mocks, but they work at runtime
// @ts-ignore - Mock functions work correctly in tests
const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('mocked-hash'),
  compare: jest.fn().mockResolvedValue(true),
  getRounds: jest.fn().mockReturnValue(12),
}

// Assign the mock to the mocked module
// @ts-ignore - Jest mocking works at runtime
Object.assign(bcrypt, mockBcrypt)

describe('Password Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    const validPassword = 'TestPassword123!'
    const mockHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'

    beforeEach(() => {
      mockBcrypt.hash.mockResolvedValue(mockHash)
    })

    describe('Expected Use Cases', () => {
      it('should hash a valid password successfully', async () => {
        const result = await hashPassword(validPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(validPassword, 12)
        expect(result).toBe(mockHash)
      })

      it('should use 12 salt rounds by default', async () => {
        await hashPassword(validPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(validPassword, 12)
      })

      it('should handle passwords with special characters', async () => {
        const specialPassword = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'
        
        await hashPassword(specialPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(specialPassword, 12)
      })

      it('should handle Unicode characters', async () => {
        const unicodePassword = 'Pássw0rd123!🔒'
        
        await hashPassword(unicodePassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(unicodePassword, 12)
      })
    })

    describe('Edge Cases', () => {
      it('should handle minimum length password (8 characters)', async () => {
        const minPassword = 'Pass123!'
        
        await hashPassword(minPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(minPassword, 12)
      })

      it('should handle maximum length password (72 characters)', async () => {
        const maxPassword = 'A'.repeat(71) + '1'
        
        await hashPassword(maxPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(maxPassword, 12)
      })

      it('should handle password with only numbers', async () => {
        const numberPassword = '12345678'
        
        await hashPassword(numberPassword)
        
        expect(mockBcrypt.hash).toHaveBeenCalledWith(numberPassword, 12)
      })
    })

    describe('Failure Cases', () => {
      it('should throw error for empty password', async () => {
        await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error for null password', async () => {
        await expect(hashPassword(null as any)).rejects.toThrow('Password must be a non-empty string')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error for undefined password', async () => {
        await expect(hashPassword(undefined as any)).rejects.toThrow('Password must be a non-empty string')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error for non-string password', async () => {
        await expect(hashPassword(123 as any)).rejects.toThrow('Password must be a non-empty string')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error for password too short', async () => {
        await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error for password too long', async () => {
        const longPassword = 'A'.repeat(73)
        await expect(hashPassword(longPassword)).rejects.toThrow('Password must be 72 characters or less')
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
      })

      it('should throw error when bcrypt fails', async () => {
        mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt failed'))
        
        await expect(hashPassword(validPassword)).rejects.toThrow('Password hashing failed: Bcrypt failed')
      })
    })
  })

  describe('verifyPassword', () => {
    const validPassword = 'TestPassword123!'
    const validHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'

    describe('Expected Use Cases', () => {
      it('should return true for correct password', async () => {
        mockBcrypt.compare.mockResolvedValue(true)
        
        const result = await verifyPassword(validPassword, validHash)
        
        expect(mockBcrypt.compare).toHaveBeenCalledWith(validPassword, validHash)
        expect(result).toBe(true)
      })

      it('should return false for incorrect password', async () => {
        mockBcrypt.compare.mockResolvedValue(false)
        
        const result = await verifyPassword('WrongPassword123!', validHash)
        
        expect(mockBcrypt.compare).toHaveBeenCalledWith('WrongPassword123!', validHash)
        expect(result).toBe(false)
      })

      it('should handle special characters in password', async () => {
        mockBcrypt.compare.mockResolvedValue(true)
        const specialPassword = 'P@ssw0rd!#$%^&*()'
        
        const result = await verifyPassword(specialPassword, validHash)
        
        expect(result).toBe(true)
      })
    })

    describe('Edge Cases', () => {
      it('should handle Unicode characters', async () => {
        mockBcrypt.compare.mockResolvedValue(true)
        const unicodePassword = 'Pássw0rd123!🔒'
        
        const result = await verifyPassword(unicodePassword, validHash)
        
        expect(result).toBe(true)
      })

      it('should handle very long passwords', async () => {
        mockBcrypt.compare.mockResolvedValue(true)
        const longPassword = 'A'.repeat(72)
        
        const result = await verifyPassword(longPassword, validHash)
        
        expect(result).toBe(true)
      })
    })

    describe('Failure Cases', () => {
      it('should throw error for empty password', async () => {
        await expect(verifyPassword('', validHash)).rejects.toThrow('Password verification failed')
        expect(mockBcrypt.compare).not.toHaveBeenCalled()
      })

      it('should throw error for null password', async () => {
        await expect(verifyPassword(null as any, validHash)).rejects.toThrow('Password verification failed')
        expect(mockBcrypt.compare).not.toHaveBeenCalled()
      })

      it('should throw error for empty hash', async () => {
        await expect(verifyPassword(validPassword, '')).rejects.toThrow('Password verification failed')
        expect(mockBcrypt.compare).not.toHaveBeenCalled()
      })

      it('should throw error for null hash', async () => {
        await expect(verifyPassword(validPassword, null as any)).rejects.toThrow('Password verification failed')
        expect(mockBcrypt.compare).not.toHaveBeenCalled()
      })

      it('should throw generic error when bcrypt fails', async () => {
        mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt comparison failed'))
        
        await expect(verifyPassword(validPassword, validHash)).rejects.toThrow('Password verification failed')
      })

      it('should not leak specific error information', async () => {
        mockBcrypt.compare.mockRejectedValue(new Error('Specific internal error'))
        
        await expect(verifyPassword(validPassword, validHash)).rejects.toThrow('Password verification failed')
        await expect(verifyPassword(validPassword, validHash)).rejects.not.toThrow('Specific internal error')
      })
    })
  })

  describe('validatePasswordStrength', () => {
    describe('Valid Passwords', () => {
      it('should validate a strong password', () => {
        const result = validatePasswordStrength('StrongP@ssw0rd123!')
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate minimum requirements', () => {
        const result = validatePasswordStrength('Aa1!')
        
        // This should fail because it's too short
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
      })

      it('should validate 8 character password with all requirements', () => {
        const result = validatePasswordStrength('Passw0rd!')
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('Invalid Passwords', () => {
      it('should fail for password too short', () => {
        const result = validatePasswordStrength('Short1!')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
      })

      it('should fail for password too long', () => {
        const longPassword = 'A'.repeat(73) + 'a1!'
        const result = validatePasswordStrength(longPassword)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be 72 characters or less')
      })

      it('should fail for missing uppercase letter', () => {
        const result = validatePasswordStrength('lowercase123!')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
      })

      it('should fail for missing lowercase letter', () => {
        const result = validatePasswordStrength('UPPERCASE123!')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one lowercase letter')
      })

      it('should fail for missing number', () => {
        const result = validatePasswordStrength('NoNumbers!')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one number')
      })

      it('should fail for missing special character', () => {
        const result = validatePasswordStrength('NoSpecial123')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one special character')
      })

      it('should return multiple errors for weak password', () => {
        const result = validatePasswordStrength('weak')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(4) // length, uppercase, number, special
        expect(result.errors).toContain('Password must be at least 8 characters long')
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
        expect(result.errors).toContain('Password must contain at least one number')
        expect(result.errors).toContain('Password must contain at least one special character')
      })
    })

    describe('Special Character Testing', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':"\\|,.<>/?'
      
      it('should accept various special characters', () => {
        for (const char of specialChars) {
          const password = `TestPass1${char}`
          const result = validatePasswordStrength(password)
          
          expect(result.isValid).toBe(true)
        }
      })
    })
  })

  describe('shouldRehashPassword', () => {
    describe('Valid Hash Analysis', () => {
      it('should return false for hash with current rounds (12)', () => {
        mockBcrypt.getRounds.mockReturnValue(12)
        
        const result = shouldRehashPassword('$2a$12$validhash')
        
        expect(result).toBe(false)
        expect(mockBcrypt.getRounds).toHaveBeenCalledWith('$2a$12$validhash')
      })

      it('should return true for hash with lower rounds (10)', () => {
        mockBcrypt.getRounds.mockReturnValue(10)
        
        const result = shouldRehashPassword('$2a$10$oldhash')
        
        expect(result).toBe(true)
        expect(mockBcrypt.getRounds).toHaveBeenCalledWith('$2a$10$oldhash')
      })

      it('should return false for hash with higher rounds (14)', () => {
        mockBcrypt.getRounds.mockReturnValue(14)
        
        const result = shouldRehashPassword('$2a$14$stronghash')
        
        expect(result).toBe(false)
        expect(mockBcrypt.getRounds).toHaveBeenCalledWith('$2a$14$stronghash')
      })
    })

    describe('Invalid Hash Handling', () => {
      it('should return true for malformed hash', () => {
        mockBcrypt.getRounds.mockImplementation(() => {
          throw new Error('Invalid hash format')
        })
        
        const result = shouldRehashPassword('invalid-hash')
        
        expect(result).toBe(true)
      })

      it('should return true for empty hash', () => {
        mockBcrypt.getRounds.mockImplementation(() => {
          throw new Error('Invalid hash format')
        })
        
        const result = shouldRehashPassword('')
        
        expect(result).toBe(true)
      })
    })
  })

  describe('generateSecurePassword', () => {
    describe('Expected Use Cases', () => {
      it('should generate password with default length (16)', () => {
        const password = generateSecurePassword()
        
        expect(password).toHaveLength(16)
        expect(typeof password).toBe('string')
      })

      it('should generate password with custom length', () => {
        const password = generateSecurePassword(24)
        
        expect(password).toHaveLength(24)
      })

      it('should generate different passwords on multiple calls', () => {
        const password1 = generateSecurePassword()
        const password2 = generateSecurePassword()
        
        expect(password1).not.toBe(password2)
      })

      it('should contain only valid characters', () => {
        const password = generateSecurePassword(100)
        const validChars = /^[A-Za-z0-9!@#$%^&*]+$/
        
        expect(validChars.test(password)).toBe(true)
      })
    })

    describe('Edge Cases', () => {
      it('should handle very short length', () => {
        const password = generateSecurePassword(1)
        
        expect(password).toHaveLength(1)
      })

      it('should handle very long length', () => {
        const password = generateSecurePassword(200)
        
        expect(password).toHaveLength(200)
      })

      it('should handle zero length', () => {
        const password = generateSecurePassword(0)
        
        expect(password).toHaveLength(0)
        expect(password).toBe('')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should hash and verify password workflow', async () => {
      // Mock the workflow
      const password = 'IntegrationTest123!'
      const mockHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'
      
      mockBcrypt.hash.mockResolvedValue(mockHash)
      mockBcrypt.compare.mockResolvedValue(true)
      
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(hash).toBe(mockHash)
      expect(isValid).toBe(true)
    })

    it('should fail verification with wrong password workflow', async () => {
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const mockHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'
      
      mockBcrypt.hash.mockResolvedValue(mockHash)
      mockBcrypt.compare.mockResolvedValue(false)
      
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })

    it('should detect need for rehashing', async () => {
      // Mock a hash with 10 rounds (lower than current 12)
      mockBcrypt.getRounds.mockReturnValue(10)
      const oldHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1PHRyY4sSUJkMdlHiQeJTM.2rjzRGe6'
      
      const needsRehash = shouldRehashPassword(oldHash)
      
      expect(needsRehash).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should hash password within reasonable time', async () => {
      const password = 'PerformanceTest123!'
      const mockHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'
      
      // Mock with slight delay to simulate real bcrypt timing
      mockBcrypt.hash.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return mockHash
      })
      
      const startTime = Date.now()
      await hashPassword(password)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should verify password within reasonable time', async () => {
      const password = 'PerformanceTest123!'
      const mockHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'
      
      // Mock with slight delay
      mockBcrypt.hash.mockResolvedValue(mockHash)
      mockBcrypt.compare.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        return true
      })
      
      const hash = await hashPassword(password)
      
      const startTime = Date.now()
      await verifyPassword(password, hash)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(500) // Verification should be faster than hashing
    })
  })
})