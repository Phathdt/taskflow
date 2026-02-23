# TaskFlow API Specification

Base URL: `/api/v1`

> **Note**: All responses use **snake_case** keys (via `SnakeToCamelInterceptor`) and include `trace_id` for request tracing.

---

## 1. Authentication

### 1.1 Register

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| email | required, valid email format, unique |
| password | required, min 8 chars |
| name | required, min 2 chars, max 100 chars |

**Response 201:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "worker",
    "created_at": "2026-02-23T09:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| VALIDATION_ERROR | 400 | Invalid input |
| CONFLICT | 409 | Email already exists |

---

### 1.2 Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "worker"
    }
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Invalid credentials |

---

### 1.3 Logout

```
POST /auth/logout
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": {
    "message": "Logged out successfully"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |

---

### 1.4 Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "worker",
    "created_at": "2026-02-23T09:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |

---

## 2. Users

### 2.1 List Users (Admin)

```
GET /users
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "admin@taskflow.local",
      "name": "Admin",
      "role": "admin",
      "created_at": "2026-02-23T09:00:00.000Z"
    },
    {
      "id": 2,
      "email": "worker@example.com",
      "name": "Worker",
      "role": "worker",
      "created_at": "2026-02-23T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "total_pages": 1
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Not admin |

---

### 2.2 Get User by ID

```
GET /users/:id
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | User ID |

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "worker",
    "created_at": "2026-02-23T09:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Access Rules:**
- Admin: any user
- Worker: only self

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Worker accessing other user |
| NOT_FOUND | 404 | User not found |

---

### 2.3 Change User Role (Admin)

```
PATCH /users/:id/role
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | User ID |

**Request Body:**
```json
{
  "role": "admin"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| role | required, enum: `admin`, `worker` |

**Response 200:**
```json
{
  "data": {
    "id": 2,
    "email": "worker@example.com",
    "name": "Worker",
    "role": "admin",
    "created_at": "2026-02-23T10:00:00.000Z",
    "updated_at": "2026-02-23T11:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Not admin / Self-demotion |
| NOT_FOUND | 404 | User not found |
| VALIDATION_ERROR | 400 | Invalid role value |

---

## 3. Tasks

### 3.1 Create Task (Admin)

```
POST /tasks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive docs for the API",
  "priority": "high",
  "due_date": "2026-03-01T00:00:00.000Z",
  "assignee_id": 2
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| title | required, min 1 char, max 255 chars |
| description | optional, max 2000 chars |
| priority | optional, enum: `low`, `medium`, `high`, `urgent`, default: `medium` |
| due_date | optional, ISO 8601 datetime, must be future |
| assignee_id | optional, must exist |

**Response 201:**
```json
{
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive docs for the API",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-03-01T00:00:00.000Z",
    "created_by_id": 1,
    "assignee_id": 2,
    "created_at": "2026-02-23T09:00:00.000Z",
    "updated_at": "2026-02-23T09:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Not admin |
| VALIDATION_ERROR | 400 | Invalid input |
| NOT_FOUND | 404 | Assignee not found |

---

### 3.2 List Tasks

```
GET /tasks
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |
| status | string | - | Filter by status |
| priority | string | - | Filter by priority |
| assignee_id | number | - | Filter by assignee (Admin only) |

**Access Rules:**
- Admin: all tasks
- Worker: only assigned tasks

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive docs for the API",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-03-01T00:00:00.000Z",
      "created_by_id": 1,
      "assignee_id": 2,
      "created_at": "2026-02-23T09:00:00.000Z",
      "updated_at": "2026-02-23T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |

---

### 3.3 Get Task by ID

```
GET /tasks/:id
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | Task ID |

**Access Rules:**
- Admin: any task
- Worker: only if assigned

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive docs for the API",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-03-01T00:00:00.000Z",
    "created_by_id": 1,
    "assignee_id": 2,
    "created_by": {
      "id": 1,
      "name": "Admin",
      "email": "admin@taskflow.local"
    },
    "assignee": {
      "id": 2,
      "name": "Worker",
      "email": "worker@example.com"
    },
    "created_at": "2026-02-23T09:00:00.000Z",
    "updated_at": "2026-02-23T09:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Worker not assigned |
| NOT_FOUND | 404 | Task not found |

---

### 3.4 Update Task

```
PATCH /tasks/:id
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | Task ID |

**Request Body (Admin):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "urgent",
  "due_date": "2026-03-15T00:00:00.000Z"
}
```

**Request Body (Worker - only status):**
```json
{
  "status": "in_progress"
}
```

**Validation:**
| Field | Rules | Who can update |
|-------|-------|----------------|
| title | min 1, max 255 | Admin |
| description | max 2000 | Admin |
| status | enum: `pending`, `in_progress`, `completed`, `cancelled` | Admin, Worker (if assigned) |
| priority | enum: `low`, `medium`, `high`, `urgent` | Admin |
| due_date | ISO 8601 | Admin |

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "title": "Updated title",
    "description": "Updated description",
    "status": "in_progress",
    "priority": "urgent",
    "due_date": "2026-03-15T00:00:00.000Z",
    "created_by_id": 1,
    "assignee_id": 2,
    "created_at": "2026-02-23T09:00:00.000Z",
    "updated_at": "2026-02-23T10:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Worker not assigned / Worker updating non-status field |
| NOT_FOUND | 404 | Task not found |
| VALIDATION_ERROR | 400 | Invalid input |

---

### 3.5 Delete Task (Admin)

```
DELETE /tasks/:id
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | Task ID |

**Response 200:**
```json
{
  "data": {
    "message": "Task deleted successfully"
  },
  "trace_id": "abc123xyz"
}
```

> Note: Soft delete - sets `deleted_at` timestamp

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Not admin |
| NOT_FOUND | 404 | Task not found |

---

### 3.6 Assign Task (Admin)

```
PATCH /tasks/:id/assign
Authorization: Bearer <token>
```

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | number | Task ID |

**Request Body:**
```json
{
  "assignee_id": 3
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| assignee_id | required, user must exist |

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "status": "pending",
    "priority": "high",
    "assignee_id": 3,
    "updated_at": "2026-02-23T11:00:00.000Z"
  },
  "trace_id": "abc123xyz"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | Not admin |
| NOT_FOUND | 404 | Task or assignee not found |

---

## 4. Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "trace_id": "abc123xyz"
}
```

### Success with Pagination
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  },
  "trace_id": "abc123xyz"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "trace_id": "abc123xyz"
}
```

---

## 5. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request body/params |
| UNAUTHORIZED | 401 | Missing/invalid/expired token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate) |
| INTERNAL_ERROR | 500 | Server error |

---

## 6. Enums

### Role
```typescript
'admin' | 'worker'
```

### TaskStatus
```typescript
'pending' | 'in_progress' | 'completed' | 'cancelled'
```

### Priority
```typescript
'low' | 'medium' | 'high' | 'urgent'
```

---

## 7. Request/Response Casing

| Layer | Casing | Example |
|-------|--------|---------|
| Request Body | snake_case | `assignee_id`, `due_date` |
| Response Body | snake_case | `created_at`, `access_token` |
| Query Params | snake_case | `assignee_id`, `total_pages` |
| URL Path | kebab-case | `/users/:id/role` |
