# Product Requirements Document: TaskFlow API

## 1. Overview

### 1.1 Product Summary

TaskFlow is a backend API service for task management with role-based access control. Designed as a mobile-app MVP backend supporting authentication, authorization, and task workflow operations.

### 1.2 Tech Stack

- **Runtime**: Node.js v22+
- **Framework**: NestJS
- **Database**: PostgreSQL v16+ (Prisma ORM)
- **Cache**: Redis v7.2+
- **Build**: Turborepo + Rolldown

### 1.3 Success Criteria

- Secure JWT-based authentication
- Role-based access control (Admin/Worker)
- Complete task CRUD with assignment workflow
- Clean, maintainable, production-ready code

---

## 2. User Roles

### 2.1 Admin

| Capability      | Description                           |
| --------------- | ------------------------------------- |
| User Management | Manage user roles (promote/demote)    |
| Task Assignment | Assign tasks to any user              |
| Full Visibility | Access all tasks in the system        |
| Task CRUD       | Create, read, update, delete any task |

### 2.2 Worker

| Capability         | Description                      |
| ------------------ | -------------------------------- |
| Limited Visibility | View only tasks assigned to them |
| Task Updates       | Update status of assigned tasks  |
| No Assignment      | Cannot assign tasks to others    |
| No Role Changes    | Cannot modify user roles         |

---

## 3. Functional Requirements

### 3.1 Authentication Module

#### JWT Whitelist Architecture (Redis-based)

**Concept**: Token whitelist instead of blacklist - only tokens stored in Redis are valid.

**Redis Key Format**:

```
/users/{userId}/session/{subToken}
```

**JWT Payload Structure**:

```typescript
interface JwtPayload {
  userId: number // int, matches DB
  email: string
  name: string
  role: 'admin' | 'worker' // lowercase, matches DB
  subToken: string // unique session identifier (generate id)
  iat: number // issued at
  exp: number // expiration
}
```

**Redis Value**: JWT signature (3rd part of token)

**Token Validation Flow**:

```
1. Extract Bearer token from Authorization header
2. Decode JWT → get userId, subToken from payload
3. Validate JWT signature and expiration
4. Query Redis: GET /users/{userId}/session/{subToken}
5. Compare stored signature with token's signature
6. If match → allow request; else → reject (401)
```

**Multi-device Support**: Each login creates new subToken, allowing multiple active sessions per user.

---

#### FR-AUTH-01: User Registration

- **Endpoint**: `POST /auth/register`
- **Input**: email, password, name
- **Behavior**:
  - Validate email format and uniqueness
  - Hash password with bcrypt (min 10 rounds)
  - Default role: `WORKER`
  - Return user profile (exclude password)

#### FR-AUTH-02: User Login

- **Endpoint**: `POST /auth/login`
- **Input**: email, password
- **Behavior**:
  - Verify credentials
  - Generate unique `subToken` (generate id 21 chars)
  - Create JWT with payload: { userId, email, name, role, subToken }
  - Set TTL: 30 days (2592000 seconds)
  - Store in Redis: `SET /users/{userId}/session/{subToken} {signature} EX 2592000`
  - Return: { accessToken, user }

#### FR-AUTH-03: Logout (All Sessions)

- **Endpoint**: `POST /auth/logout`
- **Auth**: Required
- **Behavior**:
  - Delete all Redis keys matching: `/users/{userId}/session/*`
  - All tokens for this user become invalid
  - Forces re-login on all devices

#### FR-AUTH-04: Get Current User

- **Endpoint**: `GET /auth/me`
- **Auth**: Required
- **Behavior**: Return authenticated user profile from JWT payload

---

#### Guards & Middleware

**AuthGuard (JWT Whitelist)**:

```typescript
// Pseudo-code
@Injectable()
class AuthGuard implements CanActivate {
  async canActivate(context) {
    const token = extractBearerToken(request)
    const payload = jwtService.verify(token)

    // Check whitelist
    const key = `/users/${payload.userId}/session/${payload.subToken}`
    const storedSignature = await redis.get(key)

    if (!storedSignature) throw UnauthorizedException('Session expired')
    if (storedSignature !== token.split('.')[2]) throw UnauthorizedException('Invalid token')

    // Check TTL for expiration detection
    const ttl = await redis.ttl(key)
    if (ttl <= 0) throw UnauthorizedException('Token expired')

    request.user = payload
    return true
  }
}
```

**RolesGuard**:

```typescript
@Injectable()
class RolesGuard implements CanActivate {
  canActivate(context) {
    const requiredRoles = reflector.get<Role[]>('roles', context.getHandler())
    if (!requiredRoles) return true

    const { role } = context.switchToHttp().getRequest().user
    return requiredRoles.includes(role)
  }
}
```

**Decorators**:

```typescript
@Roles(Role.ADMIN)        // Require admin role
@CurrentUser()            // Inject user from request
@Public()                 // Skip auth for endpoint
```

---

### 3.2 User Management Module

> **Note**: First admin account seeded via Prisma migration.

#### FR-USER-01: List Users (Admin Only)

- **Endpoint**: `GET /users`
- **Auth**: Admin required
- **Behavior**: Return paginated user list

#### FR-USER-02: Get User by ID

- **Endpoint**: `GET /users/:id`
- **Auth**: Required
- **Behavior**:
  - Admin: any user
  - Worker: only self

#### FR-USER-03: Change User Role (Admin Only)

- **Endpoint**: `PATCH /users/:id/role`
- **Auth**: Admin required
- **Input**: `{ role: 'admin' | 'worker' }`
- **Behavior**:
  - Validate role value
  - Prevent self-demotion (admin cannot demote themselves)
  - Update user role
  - Return updated user profile

---

### 3.3 Task Management Module

#### FR-TASK-01: Create Task

- **Endpoint**: `POST /tasks`
- **Auth**: Admin required
- **Input**: title, description, assigneeId (optional), dueDate (optional), priority
- **Behavior**:
  - Create task with status `PENDING`
  - Set creator as `createdById`

#### FR-TASK-02: List Tasks

- **Endpoint**: `GET /tasks`
- **Auth**: Required
- **Query Params**: status, priority, assigneeId, page, limit
- **Behavior**:
  - Admin: all tasks (with filters)
  - Worker: only assigned tasks

#### FR-TASK-03: Get Task by ID

- **Endpoint**: `GET /tasks/:id`
- **Auth**: Required
- **Behavior**:
  - Admin: any task
  - Worker: only if assigned

#### FR-TASK-04: Update Task

- **Endpoint**: `PATCH /tasks/:id`
- **Auth**: Required
- **Input**: title, description, status, priority, dueDate
- **Behavior**:
  - Admin: update any field
  - Worker: update only status of assigned tasks

#### FR-TASK-05: Delete Task

- **Endpoint**: `DELETE /tasks/:id`
- **Auth**: Admin required
- **Behavior**: Soft delete (set deletedAt)

#### FR-TASK-06: Assign Task

- **Endpoint**: `PATCH /tasks/:id/assign`
- **Auth**: Admin required
- **Input**: assigneeId
- **Behavior**:
  - Validate assignee exists
  - Update task assignee

---

## 4. Data Models

> **Note**: Prisma schema uses `String` for all enum-like fields. Validation handled in NestJS code layer.

### 4.1 User (Prisma)

```prisma
model User {
  id       Int    @id @default(autoincrement()) @map("id")
  email    String @unique @map("email")
  password String @map("password")
  name     String @map("name")
  role     String @default("worker") @map("role")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### 4.2 Task (Prisma)

```prisma
model Task {
  id          Int     @id @default(autoincrement()) @map("id")
  title       String  @map("title")
  description String? @map("description")
  status      String  @default("pending") @map("status")
  priority    String  @default("medium") @map("priority")

  dueDate     DateTime? @map("due_date")
  createdById Int       @map("created_by_id")
  assigneeId  Int?      @map("assignee_id")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("tasks")
}
```

> **Note**: No Prisma relations. Joins handled in code via separate queries.

### 4.3 Admin Seed (Migration)

```sql
-- prisma/seed.ts or migration
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES ('admin@taskflow.local', '<bcrypt_hash>', 'Admin', 'admin', NOW(), NOW());
```

### 4.4 TypeScript Enums (Code Layer)

```typescript
// libs/share/src/enums/role.enum.ts
export const Role = {
  ADMIN: 'admin',
  WORKER: 'worker',
} as const
export type Role = (typeof Role)[keyof typeof Role]

// libs/share/src/enums/task-status.enum.ts
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

// libs/share/src/enums/priority.enum.ts
export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const
export type Priority = (typeof Priority)[keyof typeof Priority]
```

### 4.4 Validation (DTO Layer)

```typescript
// Use class-validator with enum values
@IsIn(Object.values(Role))
role: Role

@IsIn(Object.values(TaskStatus))
status: TaskStatus
```

---

## 5. API Response Format

### 5.1 Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### 5.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

### 5.3 Error Codes

| Code             | HTTP Status | Description                               |
| ---------------- | ----------- | ----------------------------------------- |
| VALIDATION_ERROR | 400         | Invalid input                             |
| UNAUTHORIZED     | 401         | Auth required                             |
| FORBIDDEN        | 403         | Insufficient permissions                  |
| NOT_FOUND        | 404         | Resource not found                        |
| CONFLICT         | 409         | Resource conflict (e.g., duplicate email) |
| INTERNAL_ERROR   | 500         | Server error                              |

---

## 6. Non-Functional Requirements

### 6.1 Security

- Password hashing: bcrypt (min 10 rounds)
- JWT signing: HS256 with strong secret (32+ chars)
- **Token whitelist**: Redis-based session management
- **Session isolation**: Each login = unique subToken
- **Instant revocation**: Delete Redis key to invalidate token
- Rate limiting: 100 req/min per IP
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- XSS/CSRF protection headers

### 6.2 Performance

- API response time: < 200ms (p95)
- Database connection pooling
- Redis caching for frequently accessed data

### 6.3 Code Quality

- TypeScript strict mode
- ESLint + Prettier enforcement
- Unit tests for services
- Integration tests for endpoints

---

## 7. API Endpoints Summary

| Method | Endpoint          | Auth | Role  | Description                         |
| ------ | ----------------- | ---- | ----- | ----------------------------------- |
| POST   | /auth/register    | -    | -     | Register new user (default: worker) |
| POST   | /auth/login       | -    | -     | Login (creates session in Redis)    |
| POST   | /auth/logout      | Yes  | Any   | Logout all sessions                 |
| GET    | /auth/me          | Yes  | Any   | Get current user                    |
| GET    | /users            | Yes  | Admin | List users                          |
| GET    | /users/:id        | Yes  | Any\* | Get user                            |
| PATCH  | /users/:id/role   | Yes  | Admin | Change user role                    |
| POST   | /tasks            | Yes  | Admin | Create task                         |
| GET    | /tasks            | Yes  | Any\* | List tasks                          |
| GET    | /tasks/:id        | Yes  | Any\* | Get task                            |
| PATCH  | /tasks/:id        | Yes  | Any\* | Update task                         |
| DELETE | /tasks/:id        | Yes  | Admin | Delete task                         |
| PATCH  | /tasks/:id/assign | Yes  | Admin | Assign task                         |

\*Role-based filtering applies

---

## 8. Implementation Phases

### Phase 1: Foundation

- [ ] Database schema (Prisma)
- [ ] Admin seed (migration)
- [ ] Redis connection setup
- [ ] JWT token provider service
- [ ] Session store service (Redis whitelist)

### Phase 2: Authentication

- [ ] Auth module (register, login, logout)
- [ ] AuthGuard (JWT whitelist validation)
- [ ] RolesGuard
- [ ] Decorators (@Roles, @CurrentUser, @Public)

### Phase 3: User Management

- [ ] List users (Admin only)
- [ ] Get user by ID
- [ ] Change user role (Admin only)

### Phase 4: Task Management

- [ ] Task CRUD endpoints
- [ ] Assignment logic
- [ ] Role-based filtering

### Phase 5: Polish

- [ ] Error handling
- [ ] Validation pipes
- [ ] Tests

---

## 9. Session Management (Redis)

### 9.1 Key Structure

```
/users/{userId}/session/{subToken}
```

### 9.2 Operations

| Operation        | Redis Command                          | Description              |
| ---------------- | -------------------------------------- | ------------------------ |
| Create session   | `SET key signature EX 2592000`         | Store on login           |
| Validate session | `GET key`                              | Check in AuthGuard       |
| Check expiry     | `TTL key`                              | Detect remaining time    |
| Logout           | `KEYS + DEL /users/{userId}/session/*` | Remove all user sessions |

### 9.3 Session Lifecycle

```
Login → Generate subToken → Create JWT → Store signature in Redis
                                              ↓
Request → Extract JWT → Validate → Check Redis whitelist → Allow/Deny
                                              ↓
Logout → Delete Redis key → Token invalid immediately
```

### 9.4 Benefits

- **Instant revocation**: No waiting for token expiry
- **Multi-device**: Each login creates unique session
- **Full logout**: Single logout invalidates all devices
- **Audit trail**: Can enumerate active sessions

---

## 10. Out of Scope

- Frontend/UI
- Deployment/Infrastructure
- File uploads
- Notifications
- Advanced search/filtering
- Audit logging
- Multi-tenancy
