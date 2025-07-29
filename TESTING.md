# Testing Strategy

> **Philosophy**: Test the critical paths and breaking points, not every edge case. Focus on high-impact, low-maintenance tests that catch real problems.

## 🎯 Testing Priorities (Early to Mid-Stage App)

### **CRITICAL - Must Test**
1. **Authentication flows** - login, signup, password reset
2. **Database schema compatibility** - ensure tests break when schema changes
3. **Core business logic** - payment calculations, property matching, etc.
4. **Security utilities** - password hashing, validation, authorization
5. **API contract compliance** - request/response formats

### **IMPORTANT - Test When Built**  
1. **Feature workflows** - user registration → property creation → application
2. **Data integrity** - relationships between users, properties, applications
3. **Permission boundaries** - role-based access control

### **NICE TO HAVE - Later**
1. **UI component behavior** - complex form interactions
2. **Performance edge cases** - large dataset handling
3. **Browser compatibility** - cross-platform testing

## 🧪 Testing Approach by Layer

### **1. Utility Functions (Unit Tests)**
**Focus**: Pure functions with clear inputs/outputs
```typescript
// ✅ Test these - critical security functions
hashPassword(), verifyPassword(), validatePasswordStrength()

// ✅ Test these - core business logic  
calculateRent(), validateApplication(), checkAvailability()

// ❌ Skip these for now - simple helpers
formatDate(), generateId(), parseAddress()
```

**Strategy**: Mock external dependencies, test expected/edge/failure cases

### **2. Database & Schema (Integration Tests)**
**Focus**: Schema changes break tests, forcing updates
```typescript
// ✅ Type-safe factories catch schema changes
const createTestUser = (overrides: Partial<User> = {}): User => ({
  // TypeScript errors when schema changes
})

// ✅ Test critical database operations
userRegistration(), sessionCreation(), dataRelationships()

// ❌ Skip for now - basic CRUD
getAllUsers(), updateUserProfile(), deleteUser()
```

**Strategy**: Use Prisma types, minimal mocking, focus on relationships

### **3. API Routes (Contract Tests)**
**Focus**: Request/response contracts and authentication
```typescript
// ✅ Test these - authentication critical
POST /api/auth/signin, POST /api/auth/signup

// ✅ Test these - core business flows
POST /api/properties, POST /api/applications

// ❌ Skip for now - simple CRUD
GET /api/users, PUT /api/users/:id
```

**Strategy**: Test happy path + authentication failure + validation errors

### **4. Feature Workflows (End-to-End)**
**Focus**: Critical user journeys work end-to-end
```typescript
// ✅ Test these - core business value
"User can register → create property → receive application"
"Tenant can search → apply → get approved/rejected"

// ❌ Skip for now - nice-to-have features  
"User can export data", "Admin can generate reports"
```

**Strategy**: Happy path only, use real database, minimal UI testing

## 📁 Test Organization

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── auth.test.ts           # Authentication utilities
│   │   ├── password.test.ts       # Password security functions
│   │   └── business-logic.test.ts # Core calculations/validation
├── app/api/
│   ├── auth/
│   │   └── __tests__/
│   │       └── auth-routes.test.ts # Authentication API tests
│   └── properties/
│       └── __tests__/
│           └── property-routes.test.ts # Property API tests
└── __tests__/
    ├── test-utils.ts              # Shared test utilities
    ├── factories.ts               # Type-safe data factories
    └── workflows/
        ├── user-registration.test.ts    # End-to-end workflows
        └── property-application.test.ts
```

## 🏗️ Schema Change Testing

### **Problem**: Schema changes break existing functionality silently
### **Solution**: Type-safe factories that force test updates

```typescript
// src/__tests__/factories.ts
import { User, Property, Application } from '@prisma/client'

// ✅ These MUST match current Prisma schema
export const UserFactory = (overrides: Partial<User> = {}): User => ({
  id: `user-${Date.now()}`,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$12$hashedpassword',
  role: 'TENANT',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  // TypeScript ERROR if schema adds required field
  ...overrides
})
```

### **Workflow for Schema Changes**:
1. **Update schema** in `prisma/schema.prisma`
2. **Run** `npx prisma generate` 
3. **Tests fail** with TypeScript errors in factories
4. **Update factories** to include new fields
5. **Add tests** for new functionality (if needed)
6. **Create migration** with `npx prisma migrate dev`

## 🔧 Test Setup & Configuration

### **Jest Configuration** (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/components/ui/**', // Skip shadcn/ui components
  ],
  coverageThreshold: {
    global: {
      functions: 70, // Focus on function coverage
      lines: 60,     // Less strict on line coverage
      branches: 50   // Least strict on branches
    }
  }
}
```

### **Test Environment** (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test@localhost/test'

// Global test utilities
global.testUser = { /* common test data */ }
```

## 🚀 Test Execution Strategy

### **Development Workflow**
```bash
# Run tests for current feature
npm test -- --testPathPattern=auth

# Run tests with coverage (pre-commit)
npm run test:coverage

# Run all tests (CI/CD)
npm run test:ci
```

### **Database Testing**
```bash
# Test with fresh database
npm run db:test:reset && npm test

# Test migrations
npm run db:migrate:test
```

## 📊 Testing Metrics & Goals

### **Coverage Targets** (Pragmatic, not perfectionist)
- **Critical utilities**: 90%+ (auth, payments, security)
- **API routes**: 80%+ (authentication + validation)
- **Business logic**: 70%+ (core calculations)
- **UI components**: 50%+ (major user flows only)

### **What We DON'T Test** (Early Stage)
- ❌ **Third-party integrations** (NextAuth, Prisma internals)
- ❌ **Simple getters/setters** (basic property access)
- ❌ **Static configurations** (constants, enums)
- ❌ **Complex UI interactions** (drag/drop, animations)
- ❌ **Browser-specific behavior** (unless causing real issues)

## 🛡️ Critical Test Cases (Never Skip)

### **Security**
```typescript
// Password security
it('should hash passwords with sufficient salt rounds')
it('should reject weak passwords')
it('should verify passwords without timing attacks')

// Authentication 
it('should reject invalid credentials')
it('should create secure sessions')
it('should enforce role-based access')
```

### **Data Integrity**
```typescript
// Schema compliance
it('should create valid users matching schema')
it('should maintain foreign key relationships')
it('should enforce required field validation')

// Business rules
it('should prevent double-booking properties')
it('should calculate correct payment amounts')
it('should validate application eligibility')
```

## 🔄 Test Maintenance Philosophy

### **When to Update Tests**
- ✅ **Schema changes** - Always update factories
- ✅ **Breaking API changes** - Update contract tests
- ✅ **Security changes** - Update auth tests
- ❌ **UI tweaks** - Don't update unless workflow breaks
- ❌ **Performance optimizations** - Don't test internal changes

### **When to Delete Tests**
- 🗑️ **Feature removed** - Delete related tests
- 🗑️ **Business logic changed** - Rewrite, don't patch
- 🗑️ **Test becomes flaky** - Fix or delete, don't ignore

### **Red Flags** (Time to Simplify)
- 🚩 Tests take >30s to run locally
- 🚩 Tests fail frequently due to environment issues  
- 🚩 More test code than production code
- 🚩 Tests require extensive mocking to work

## 🎬 Getting Started Checklist

### **Phase 1: Foundation** ✅
- [x] Jest + React Testing Library setup
- [x] Type-safe test factories
- [x] Authentication utility tests
- [ ] Database schema compliance tests

### **Phase 2: Core Features** (Current Phase)
- [ ] User registration workflow tests
- [ ] Property creation API tests  
- [ ] Authentication flow tests
- [ ] Critical business logic tests

### **Phase 3: Business Workflows** (Later)
- [ ] End-to-end user journeys
- [ ] Payment processing tests
- [ ] Email notification tests
- [ ] File upload tests

---

## 🚨 TypeScript Testing Requirements

### **ALWAYS Run Both Tests AND TypeScript Checking**

**Critical Rule**: Every test must pass BOTH runtime tests AND TypeScript compilation.

```bash
# 1. Run tests first (check functionality)
npm test

# 2. ALWAYS run type checking (check type safety) 
npm run type-check

# 3. Both must pass before committing code
```

### **Why This Matters**
- **Tests can pass while TypeScript fails** - Runtime works but types are unsafe
- **Silent type errors are dangerous** - They cause issues during refactoring
- **Type safety prevents bugs** - Catches problems at compile time, not production

### **TypeScript Error Resolution Strategy**

**1. Fix the Root Type Issue** (Preferred)
```typescript
// ❌ BAD: Incomplete test data
const user = { email: 'test@test.com' } // Missing required fields

// ✅ GOOD: Complete type-safe test data  
const user: User = {
  id: '1',
  email: 'test@test.com', 
  name: 'Test User',
  password: 'hashed-password',
  role: 'TENANT',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**2. Proper Mock Typing** (For external libraries)
```typescript
// ❌ BAD: Untyped mock
const mockFn = jest.fn()

// ✅ GOOD: Properly typed mock
const mockFn = jest.fn() as jest.MockedFunction<typeof originalFn>
```

**3. Use @ts-ignore Sparingly** (Last resort only)
```typescript
// ⚠️ ONLY when Jest mocking has known TypeScript limitations
// Always include comment explaining why
// @ts-ignore - Jest mock typing issue with bcryptjs library
const mockBcrypt = { hash: jest.fn() }
```

### **Development Workflow**
```bash
# When writing new tests:
1. Write the test
2. Run: npm test (ensure functionality works)
3. Run: npm run type-check (ensure types are safe)
4. Fix any TypeScript errors before proceeding
5. Commit only when both pass

# Pre-commit check:
npm run type-check && npm test
```

### **Common TypeScript Test Issues**

**Schema Factory Errors** (Good thing!)
```bash
# When Prisma schema changes:
npx prisma generate  # Updates types
npm run type-check   # Should fail if factories are outdated
# Fix factories to match new schema
# This is the desired behavior - forces test updates
```

**Mock Type Errors**
```typescript
// Problem: Mock doesn't match expected interface
// Solution: Use proper Jest mock types or @ts-ignore with explanation
```

**Test Data Mismatches**
```typescript
// Problem: Test data missing required fields
// Solution: Use complete objects that satisfy TypeScript interfaces
```

---

## 💡 Key Principles

1. **Test behaviors, not implementations** - Care about what happens, not how
2. **Fail fast on breaking changes** - Use TypeScript to catch schema changes
3. **Test the unhappy path** - Authentication failures, validation errors
4. **Keep tests simple** - Easy to read, easy to maintain
5. **Test in production-like conditions** - Real database, real data shapes

**Remember**: The goal is confidence in deployments, not perfect test coverage. Test what breaks, not what works.

---

## 📋 Testing Task Tracker

> **Instructions**: Update this list as you build features. Mark items complete when tests are written and passing. Add new testing tasks as you discover them during development.

### **🔐 Authentication System Testing** ✅ FOUNDATION COMPLETE

**Completed** (2025-07-29):
- [x] Password utility tests (hashPassword, verifyPassword, validatePasswordStrength)
- [x] Authentication type guard tests (hasRole, isAdmin, isAuthenticated)
- [x] Jest and React Testing Library setup
- [x] Basic test configuration and infrastructure

**Remaining Authentication Tests**:
- [ ] **Type-safe User factory** - Create factory that breaks when User schema changes
- [ ] **NextAuth credentials provider tests** - Test login flow with database
- [ ] **Authentication API route tests** - Test /api/auth/* endpoints
- [ ] **Session management tests** - Test session creation, expiration, cleanup
- [ ] **Role-based middleware tests** - Test protected route access control

### **🏠 Property Management Testing** ⏳ NOT STARTED

**When building property features, add these tests**:
- [ ] **Property schema factory** - Type-safe factory for Property model
- [ ] **Property creation API tests** - Test POST /api/properties
- [ ] **Property validation tests** - Test required fields, data types
- [ ] **Property search/filter tests** - Test search logic and filters
- [ ] **Property image upload tests** - Test file handling and validation
- [ ] **Property availability tests** - Test booking conflicts, date ranges

### **📝 Application System Testing** ⏳ NOT STARTED

**When building application features, add these tests**:
- [ ] **Application schema factory** - Type-safe factory for Application model
- [ ] **Application submission tests** - Test form validation and storage
- [ ] **Application status workflow tests** - Test approve/reject/pending flows
- [ ] **Application eligibility tests** - Test business rules for applications
- [ ] **Document upload tests** - Test file attachments and validation

### **💳 Payment System Testing** ⏳ NOT STARTED

**When building payment features, add these tests**:
- [ ] **Payment calculation tests** - Test rent, fees, deposits calculations
- [ ] **Payment processing mock tests** - Test payment gateway integration
- [ ] **Payment history tests** - Test transaction storage and retrieval
- [ ] **Late fee calculation tests** - Test automated fee calculations
- [ ] **Payment notification tests** - Test email/SMS payment reminders

### **👥 User Management Testing** ⏳ NOT STARTED

**When building user features, add these tests**:
- [ ] **User registration workflow tests** - End-to-end signup process
- [ ] **User profile update tests** - Test profile modification and validation
- [ ] **Email verification tests** - Test verification token generation/validation
- [ ] **Password reset tests** - Test reset token flow and security
- [ ] **User role management tests** - Test role assignment and permissions

### **🔧 API & Integration Testing** ⏳ NOT STARTED

**When building API endpoints, add these tests**:
- [ ] **API contract tests** - Test request/response schemas
- [ ] **Authentication middleware tests** - Test protected route enforcement
- [ ] **Rate limiting tests** - Test API rate limits and throttling
- [ ] **Error handling tests** - Test 4xx/5xx error responses
- [ ] **Database transaction tests** - Test data consistency and rollbacks

### **🎨 UI Component Testing** ⏳ LATER

**When UI stabilizes, add these tests**:
- [ ] **Authentication form tests** - Test login/signup form behavior
- [ ] **Property listing component tests** - Test display and interaction
- [ ] **Application form tests** - Test complex form validation
- [ ] **Dashboard component tests** - Test role-based UI rendering
- [ ] **Navigation component tests** - Test routing and permissions

---

## 🚨 Critical Testing Reminders

### **When Adding New Prisma Models:**
1. **Create type-safe factory immediately** - `const createTestProperty = (overrides: Partial<Property> = {}): Property => ({...})`
2. **Run `npx prisma generate`** - Updates TypeScript types
3. **Verify factories break** - Should get TypeScript errors if schema changes
4. **Update factories with new fields** - Add defaults for all required fields
5. **Add basic validation tests** - Test required fields and business rules

### **When Building New API Routes:**
1. **Test authentication first** - Ensure protected routes are protected
2. **Test validation second** - Ensure bad requests are rejected
3. **Test happy path third** - Ensure good requests work
4. **Test error handling last** - Ensure failures are handled gracefully

### **When Adding New Features:**
1. **Start with critical path test** - Write one test for the main user flow
2. **Add schema factory if needed** - For any new database models
3. **Test security boundaries** - Especially permissions and data access
4. **Skip UI details initially** - Focus on business logic and data flow

---

## 📈 Testing Progress Tracking

### **Current Status** (Updated: 2025-07-29)
- **Foundation**: ✅ 100% Complete (Jest, utilities, type guards)
- **Authentication**: 🔄 60% Complete (utilities done, API routes pending)
- **Schema Testing**: ⏳ 0% Complete (no factories yet)
- **Business Logic**: ⏳ 0% Complete (no features built yet)
- **UI Testing**: ⏳ 0% Complete (no UI built yet)

### **Next Testing Priorities**
1. **User schema factory** - When building user registration
2. **Property schema factory** - When building property creation
3. **Authentication API tests** - When building login/signup pages
4. **Form validation tests** - When building property/application forms

### **Testing Debt** (Things to add later)
- Performance testing for database queries
- End-to-end testing with Playwright
- Cross-browser compatibility testing
- Mobile responsiveness testing
- Security penetration testing

---

## 🎯 Testing Rules of Thumb

1. **New Model = New Factory** - Every Prisma model needs a type-safe factory
2. **New API Route = New Tests** - Authentication, validation, happy path, errors
3. **New Business Logic = New Tests** - Calculations, workflows, rules
4. **New UI Form = New Tests** - Validation, submission, error states
5. **Breaking Change = Update Tests** - Schema changes must break existing tests
6. **🚨 ALWAYS TypeScript Check** - Every test must pass `npm run type-check`

**Testing Workflow Checklist:**
- [ ] Write test
- [ ] `npm test` passes ✅
- [ ] `npm run type-check` passes ✅  
- [ ] Commit code

**When in doubt**: If it handles money, security, or user data - test it. Everything else can wait.