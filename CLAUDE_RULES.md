# CLAUDE_RULES.md

> **Instructions for Claude Code**: Always read this file at the start of each conversation to understand project coding standards and patterns.

## 🔄 Project Awareness & Context

- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

## 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Follow Next.js App Router conventions** with proper file-based routing structure.
- **Use TypeScript strictly** - avoid `any` types, prefer proper type definitions.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.

## 🎨 React/Next.js Specific Rules

- **Use shadcn/ui component pattern** - copy components into our codebase, don't import from external libraries when possible.
- **Follow component ownership philosophy** - we own and can modify all UI components.
- **Use React Hook Form + Zod** for all form handling and validation.
- **Implement proper error boundaries** and loading states for better UX.
- **Use TanStack Query** for all server state management and API calls.

## 🗄️ Database & API Patterns

- **Use Prisma** for all database operations with proper type safety.
- **Implement Zod validation** on both client and server sides.
- **Follow REST conventions** for API routes with proper HTTP methods and status codes.
- **Use proper select/include** in Prisma queries for performance.
- **Never expose sensitive data** - use proper select statements and exclude password fields.

## 🧪 Testing & Reliability

- **Follow the testing strategy** outlined in `TESTING.md` - focus on critical paths over comprehensive coverage.
- **Always create tests for security-critical functions** (authentication, validation, permissions).
- **Use type-safe test factories** to ensure schema changes break tests appropriately.
- **Test behaviors, not implementations** - focus on what the code does, not how it does it.

## ✅ Task Completion

- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- **Add new sub-tasks or TODOs** discovered during development to `TASK.md` under "Discovered During Work" section.
- **Update README.md** when new features are added or setup steps change.

## 📎 Style & Conventions

- **Use TypeScript** with strict mode enabled.
- **Follow Next.js App Router patterns** - use proper layout.tsx, page.tsx, route.ts conventions.
- **Use Tailwind CSS** for styling with consistent utility classes.
- **Implement proper ESLint and Prettier** configurations.
- **Use consistent import patterns** - prefer absolute imports with `@/` prefix.

## 🔐 Security & Environment

- **Never hardcode secrets** - always use environment variables.
- **Implement proper authentication checks** on protected API routes.
- **Use NextAuth.js patterns** for session management.
- **Hash passwords with bcryptjs** before storing in database.
- **Validate all user inputs** with Zod schemas.

## 📚 Documentation & Explainability

- **Update documentation** when adding new features or changing setup steps.
- **Comment complex business logic** with clear explanations.
- **Use JSDoc comments** for utility functions and custom hooks.
- **Maintain consistent component prop interfaces** with proper TypeScript types.

## 🧠 AI Behavior Rules

- **Never assume missing context** - ask questions if uncertain about requirements.
- **Only use verified packages** from the tech stack specification - don't hallucinate dependencies.
- **Always confirm file paths exist** before referencing them in code.
- **Follow the established patterns** from PLANNING.md for consistency.
- **Focus on one task at a time** for better code quality.
- **Never delete existing code** unless explicitly instructed or part of a defined task.

## 🚀 Deployment & Infrastructure

- **Use AWS Amplify** deployment patterns as specified in PLANNING.md.
- **Configure proper environment variables** for different environments (local, dev, production).
- **Follow the established CI/CD workflow** with develop and main branches.
- **Use Neon PostgreSQL** connection patterns for database access.
