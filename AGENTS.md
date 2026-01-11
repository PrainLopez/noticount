# AGENTS.md - Guidelines for Coding Agents

## Project Overview

This is a Next.js application built with shadcn/UI components and Supabase as the backend. The project follows modern JavaScript/TypeScript practices with strict linting and formatting rules.

## Testing

Currently no explicit test runner is configured in the project. Tests would typically be implemented using Jest or Vitest. To add tests:

```bash
# Example test structure (to be implemented)
tests/
├── unit/
│   ├── components/
│   └── utils/
└── integration/
    └── supabase/
```

## Code Style Guidelines

### Imports

- Group imports in the following order:
  1. External libraries (alphabetical)
  2. Internal modules (relative paths, alphabetical)
- Use explicit extensions (`import Component from './Component'`)
- Prefer named exports over default exports
- Limit imports per file to 15 maximum

### Formatting

- Use 2-space indentation
- Use double quotes for strings
- Use trailing commas in objects and arrays
- Maximum line length: 100 characters
- Use semicolons at the end of statements

### Types

- Use TypeScript interfaces and types throughout
- Prefer `interface` over `type` for object shapes
- Use `const enum` for enums
- Use `as const` for literal values when appropriate
- Type annotations should be consistent and explicit

### Naming Conventions

- Use PascalCase for components and classes
- Use camelCase for variables and functions
- Use snake_case for constants
- Use kebab-case for filenames
- Prefix component files with capitalized name (e.g., `Button.tsx`)

### Error Handling

- Handle errors gracefully at boundaries
- Use try/catch blocks for async operations
- Validate inputs before processing
- Use proper error types and messages
- Log errors appropriately (avoid sensitive info in logs)

### React & Components

- Use functional components with hooks
- Extract complex logic to custom hooks
- Keep components focused and small
- Use prop-types or TypeScript for props validation
- Follow shadcn/ui component structure

### Supabase Integration

- Use the typed Supabase client from `lib/supabase`
- Handle auth state consistently
- Sanitize user inputs before storage
- Use RLS (Row Level Security) for data protection
- Handle edge cases in data fetching

### Git Workflow

- Commit often with meaningful messages
- Keep branches short-lived
- Rebase before merging
- Squash commits when merging PRs
- Include relevant issue numbers in commit messages

### Environment Variables

- Store secrets in `.env.local` (not committed)
- Define types in `env.d.ts`
- Use `process.env.NEXT_PUBLIC_*` for public env vars
- Validate env vars in runtime when possible

### Performance

- Memoize expensive computations
- Use React.memo for pure components
- Implement lazy loading for heavy components
- Optimize images and assets
- Debounce input handlers

### Documentation

- Document public APIs
- Include JSDoc for complex functions
- Write clear README sections
- Document edge cases and assumptions
- Keep comments minimal and meaningful

This document serves as a guide for AI coding assistants working in this repository. Follow these standards to maintain consistency and quality across the codebase.
