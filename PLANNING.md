# PLANNING.md

## Project Overview

**Project Name**: RentalManagementApp
**Type**: Production-ready React/Next.js web application
**Target**: Enterprise-grade SaaS application with modern developer experience

## Architecture & Tech Stack

### Core Framework

- **Next.js 15** with App Router (React 18)
- **TypeScript 5+** for full type safety
- **Node.js 18+** runtime

### Frontend & UI

- **Tailwind CSS** (primary styling approach)
- **shadcn/ui** (copy-paste component library - we own the code)
- **Radix UI** (accessible primitives via shadcn/ui)
- **Lucide React** (icons)
- **React Hook Form + Zod** (forms and validation)

### Backend & Database

- **Next.js API Routes** (serverless backend)
- **PostgreSQL** via **Neon** (managed hosting)
- **Prisma** (type-safe ORM)

### Authentication & Security

- **NextAuth.js v4** (industry standard)
- **bcryptjs** (password hashing)
- **Database sessions** (stored in PostgreSQL)

### State Management Philosophy

1. **React useState/useReducer** (local component state)
2. **TanStack Query** (server state management)
3. **Zustand** (simple global state when needed)
4. **Redux Toolkit** (complex scenarios only)

### Infrastructure & Hosting

- **AWS Amplify** (hosting + CI/CD)
- **AWS S3** (file storage)
- **AWS SES** (email delivery)
- **Neon PostgreSQL** (database hosting)

## Design Philosophy

### Conservative + Modern Balance

- Prioritize battle-tested technologies over cutting-edge trends
- Use tools widely adopted by Fortune 500 companies
- Maintain modern developer experience
- Plan for enterprise scalability

### Component Ownership Strategy

- **shadcn/ui approach**: Copy components into our codebase (no vendor lock-in)
- **Migration flexibility**: Can change styling approaches without API changes
- **Full customization**: Modify components directly without library limitations

### Code Quality Standards

- **TypeScript strict mode** - avoid `any` types
- **File size limit**: 500 lines maximum per file
- **Modular architecture** - clear separation of concerns
- **Comprehensive testing** - unit tests for all business logic
- **Type-safe validation** - Zod schemas for all data

## Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   ├── (marketing)/        # Public pages
│   ├── dashboard/          # Protected application
│   └── api/               # Backend API routes
├── components/             # React components
│   ├── ui/                # Base components (shadcn/ui)
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utilities & configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── prisma/               # Database schema
```

## Development Workflow

- **Local**: `localhost:3000` with local PostgreSQL database
- **Staging**: AWS Amplify `develop` branch with Neon staging database
- **Production**: AWS Amplify `main` branch with Neon production database

## Key Constraints & Guidelines

- **Security first**: All API routes require proper validation
- **Performance**: Use React Query for server state caching
- **Accessibility**: Leverage Radix UI primitives for a11y
- **SEO ready**: Proper meta tags and structured data
- **Mobile first**: Responsive design with Tailwind breakpoints

## Migration Strategy

- **Component APIs**: Maintain consistent interfaces across styling changes
- **Database**: Prisma migrations for schema evolution
- **Styling**: Can migrate from Tailwind → CSS-in-JS → CSS Modules while preserving component APIs

## Success Metrics

- **Developer Experience**: Fast local development and deployment
- **Type Safety**: Zero runtime type errors
- **Performance**: Core Web Vitals in green
- **Security**: No authentication or authorization vulnerabilities
- **Maintainability**: New developers can contribute within 1 week
