# Rental Management App

Enterprise-grade rental management system built with Next.js 15 and TypeScript.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 18+

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd rental-management-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:full` | Run TypeScript check + tests (recommended) |

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # React components
│   ├── ui/              # Base components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── lib/                 # Utilities & configurations
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

## Development

This project uses:

- TypeScript strict mode for type safety
- ESLint for code linting
- Next.js App Router for file-based routing
- Tailwind CSS for styling

## License

MIT