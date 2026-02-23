# TaskFlow

A task management API built as a Turborepo monorepo with NestJS, TypeScript, PostgreSQL (via Prisma), and Redis.

## Architecture Overview

### Monorepo Structure

```
.
├── apps/
│   └── api/                    # Main NestJS API service
├── libs/
│   ├── auth/                   # Authentication (JWT, sessions, guards)
│   ├── user/                   # User domain (entities, repository, service)
│   ├── task/                   # Task domain (entities, repository, service)
│   ├── custom-config/          # YAML-based configuration with env override
│   ├── custom-logger/          # Pino-based structured logging
│   ├── database/               # Prisma ORM and PostgreSQL
│   └── share/                  # Shared utilities, decorators, and types
├── prisma/                     # Database schema, migrations, and seed
├── scripts/                    # Build and utility scripts
└── docker-compose.yml
```

### Domain Libraries

| Library | Purpose |
|---------|---------|
| `@taskflow/auth` | JWT authentication, bcrypt password hashing, Redis session whitelist, login/register/logout |
| `@taskflow/user` | User entity, roles (admin/worker), Prisma repository |
| `@taskflow/task` | Task entity, status (pending/in_progress/completed/cancelled), priority (low/medium/high/urgent) |
| `@taskflow/custom-config` | YAML config loading (`config/config.yml`) with typed interfaces |
| `@taskflow/custom-logger` | Pino-based logger with JSON format support |
| `@taskflow/database` | Prisma client and database module |
| `@taskflow/share` | Response decorators, interceptors, error types, utility functions |

### Key Dependencies

- **Framework**: NestJS with decorators and dependency injection
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Sessions**: Redis (via `@nestjs-modules/ioredis` and `@keyv/redis`)
- **Validation**: Zod schemas with `nestjs-zod`
- **Build**: Turborepo + Rolldown bundler

## API Endpoints

### Authentication

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/auth/register` | Public | - | Register a new user (default: worker) |
| `POST` | `/auth/login` | Public | - | Login and receive JWT |
| `POST` | `/auth/logout` | Required | Any | Invalidate all sessions |
| `GET` | `/auth/me` | Required | Any | Get current user profile |

### User Management

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/users` | Required | Admin | List all users (paginated) |
| `GET` | `/users/:id` | Required | Any* | Get user by ID |
| `PATCH` | `/users/:id/role` | Required | Admin | Change user role |

### Task Management

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/tasks` | Required | Admin | Create a task |
| `GET` | `/tasks` | Required | Any* | List tasks (filtered by role) |
| `GET` | `/tasks/:id` | Required | Any* | Get task by ID |
| `PATCH` | `/tasks/:id` | Required | Any* | Update task |
| `DELETE` | `/tasks/:id` | Required | Admin | Delete task |
| `PATCH` | `/tasks/:id/assign` | Required | Admin | Assign task to user |

*Any\* = Admin sees all; Worker sees only own/assigned resources.*

## Prerequisites

- Node.js v22+
- PostgreSQL v16+
- Redis v7.2+
- Yarn 1.22+

## Getting Started

1. **Clone and Install Dependencies**

```bash
git clone <repository-url>
cd taskflow
yarn install
```

2. **Configuration Setup**

```bash
cp config/config.yml.example config/config.yml
cp .env.example .env
```

Edit `config/config.yml` with your settings:

```yaml
host:
  port: 3000
database:
  url: postgresql://postgres:postgres@localhost:15432/taskflow?schema=public
redis:
  url: redis://localhost:16379
jwt:
  secret: your-secret-key
  expires_in: 30d
auth:
  bcrypt_rounds: 10
  session_ttl_seconds: 2592000
```

3. **Start Infrastructure**

```bash
docker-compose up -d postgres-db redis-db
```

4. **Database Setup**

```bash
yarn db:generate    # Generate Prisma client
yarn db:migrate     # Run migrations
yarn db:seed        # Seed admin user (admin@taskflow.local / admin123)
```

5. **Start Development**

```bash
yarn dev            # Start API in development mode
```

## Development Commands

### Primary Development

```bash
yarn dev              # Start API service in dev mode
yarn build            # Build all packages
yarn build:prod       # Typecheck + build for production
```

### Database Operations

```bash
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Run migrations in development
yarn db:migrate:create # Create new migration
yarn db:deploy        # Deploy migrations to production
yarn db:status        # Check migration status
yarn db:studio        # Open Prisma Studio GUI
yarn db:reset         # Reset database (caution!)
yarn db:seed          # Seed admin user
```

### Code Quality

```bash
yarn lint             # ESLint with auto-fix
yarn format           # Prettier formatting
yarn typecheck        # TypeScript type checking
yarn test             # Run all tests
yarn test:ci          # Run tests with coverage
```

### Utility Commands

```bash
yarn ctix             # Regenerate index.ts files
yarn check:unused     # Detect unused exports
yarn sync:deps        # Sync workspace dependencies
yarn clean            # Remove dist, .turbo, node_modules
```

## Docker Support

### Start Required Services

```bash
docker-compose up -d postgres-db redis-db
```

### Build Docker Image

```bash
docker build --build-arg APP_NAME=api -t taskflow:latest .
```

Final image: **~143MB** (multi-stage build with Node.js 24 Alpine)

### Run Full Stack

```bash
docker-compose up
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
