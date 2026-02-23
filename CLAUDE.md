# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS starter kit. It's built as a **Turborepo** monorepo with yarn workspaces, TypeScript, PostgreSQL (via Prisma), and Redis.

## Architecture

### Monorepo Structure

- `apps/api/` - Main NestJS API service
- `libs/` - Modular libraries organized by domain:
  - `custom-config/` - YAML-based configuration with env override
  - `custom-logger/` - Pino-based structured logging
  - `database/` - Prisma ORM and PostgreSQL integration
  - `share/` - Shared utilities and types

### Key Dependencies

- **Framework**: NestJS with decorators and dependency injection
- **Database**: PostgreSQL with Prisma ORM (generates types)
- **Build**: Turborepo + Rolldown bundler

## Development Commands

### Primary Development

```bash
yarn dev                # Start API service in dev mode (uses nodemon)
yarn build              # Build all workspaces with Turborepo
yarn build:prod         # Build with type checking
yarn api:build          # Build only the API service
```

### Database Operations

```bash
yarn db:generate        # Generate Prisma client (required after schema changes)
yarn db:migrate         # Run migrations in development
yarn db:studio          # Open database GUI
```

### Code Quality (Required after changes)

```bash
yarn lint               # ESLint with auto-fix
yarn format             # Prettier formatting
yarn test               # Run Jest tests
yarn typecheck          # TypeScript type checking
```

### Turborepo Commands

```bash
turbo run build         # Build all workspaces (with caching)
turbo run dev           # Run dev servers
turbo run test          # Run all tests
turbo run lint          # Lint all workspaces
```

### Docker Services

```bash
docker-compose up -d postgres-db redis-db    # Start required services
```

## Code Standards

### Import Organization

Prettier enforces import order:

1. External packages (`@nestjs/*`, `ethers`, etc.)
2. Internal packages with `@taskflow/` prefix
3. Relative imports (`./`, `../`)

### TypeScript Configuration

- Path aliases: `@taskflow/<lib-name>` maps to `libs/<lib-name>/src`
- Decorators enabled for NestJS
- Strict typing with ES2020 target

### Linting Rules

- No explicit `any` types (strictly enforced - use proper types instead)
- Unused imports automatically removed
- Variables prefixed with `_` ignored for unused warnings

### Formatting

- 120 character line width
- Single quotes, no semicolons
- 2-space indentation
- ES5 trailing commas

## Task Completion Checklist

After making code changes:

1. `yarn typecheck` - Ensure TypeScript types are correct
2. `yarn lint` - Fix linting issues (no `any` types allowed)
3. `yarn format` - Apply formatting
4. `yarn test` - Ensure tests pass
5. `yarn db:generate` - If schema modified

### Type Safety Guidelines

- **Never use `any` types** - always specify proper TypeScript types
- Use union types, interfaces, or generic constraints instead of `any`
- For external libraries without types, create proper type definitions
- Use `unknown` for truly unknown data, then narrow with type guards

## Environment Setup

Required services:

- PostgreSQL v16+ (Docker port 15432)
- Redis v7.2+ (Docker port 16379)
- Node.js v22+

Key environment variables in `.env`:

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `APP_PORT` - API port (default: 3000)
