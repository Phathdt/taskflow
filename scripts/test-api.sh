#!/bin/bash
# Full API integration test script
# Covers: Auth, Users, Tasks (all endpoints from api-spec.md)
# Usage: ./scripts/test-api.sh [BASE_URL]

BASE_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date +%s)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() { echo -e "  ${GREEN}PASS${NC}: $1"; ((PASSED++)); }
fail() { echo -e "  ${RED}FAIL${NC}: $1"; echo "    Response: $2"; ((FAILED++)); }
info() { echo -e "  ${YELLOW}>>>${NC} $1"; }
section() { echo -e "\n${CYAN}=== $1 ===${NC}"; }

# Helper: make request and capture body + status code
request() {
  local METHOD="$1" URL="$2" TOKEN="$3" DATA="$4"
  local ARGS=(-s -w "\n%{http_code}" -X "$METHOD" "${BASE_URL}${URL}")
  [ -n "$TOKEN" ] && ARGS+=(-H "Authorization: Bearer ${TOKEN}")
  [ -n "$DATA" ] && ARGS+=(-H "Content-Type: application/json" -d "$DATA")
  curl "${ARGS[@]}"
}

parse_body() { echo "$1" | sed '$d'; }
parse_code() { echo "$1" | tail -1; }

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  TaskFlow API Integration Tests${NC}"
echo -e "${CYAN}=====================================${NC}"
echo "Base URL: ${BASE_URL}"
echo ""

########################################
section "1. AUTH - Register / Login / Me / Logout"
########################################

# 1.1 Register worker user
WORKER_EMAIL="worker-${TIMESTAMP}@example.com"
WORKER_PASS="Worker@123456"

info "Register worker user..."
RESP=$(request POST "/auth/register" "" "{\"email\":\"${WORKER_EMAIL}\",\"password\":\"${WORKER_PASS}\",\"name\":\"Test Worker\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "201" ]; then
  WORKER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Register worker (HTTP ${CODE}) - id=${WORKER_ID}"
else
  fail "Register worker (HTTP ${CODE})" "$BODY"
fi

# 1.2 Register duplicate (expect 409)
info "Register duplicate email (expect 409)..."
RESP=$(request POST "/auth/register" "" "{\"email\":\"${WORKER_EMAIL}\",\"password\":\"${WORKER_PASS}\",\"name\":\"Dup\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "409" ]; then
  pass "Duplicate register rejected (HTTP ${CODE})"
else
  fail "Duplicate register - expected 409, got ${CODE}" "$BODY"
fi

# 1.3 Register validation error (expect 400)
info "Register with invalid data (expect 400)..."
RESP=$(request POST "/auth/register" "" "{\"email\":\"bad\",\"password\":\"short\",\"name\":\"\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "400" ]; then
  pass "Validation error on register (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 400, got ${CODE}" "$BODY"
fi

# 1.4 Login as admin (seeded user)
info "Login as admin..."
RESP=$(request POST "/auth/login" "" "{\"email\":\"admin@taskflow.local\",\"password\":\"admin123\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  ADMIN_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  ADMIN_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Login admin (HTTP ${CODE}) - id=${ADMIN_ID}"
else
  fail "Login admin (HTTP ${CODE})" "$BODY"
fi

# 1.5 Login as worker
info "Login as worker..."
RESP=$(request POST "/auth/login" "" "{\"email\":\"${WORKER_EMAIL}\",\"password\":\"${WORKER_PASS}\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  WORKER_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  pass "Login worker (HTTP ${CODE})"
else
  fail "Login worker (HTTP ${CODE})" "$BODY"
fi

# 1.6 Login with wrong password (expect 401)
info "Login with wrong password (expect 401)..."
RESP=$(request POST "/auth/login" "" "{\"email\":\"${WORKER_EMAIL}\",\"password\":\"wrongpassword\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "401" ]; then
  pass "Wrong password rejected (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 401, got ${CODE}" "$BODY"
fi

# 1.7 GET /auth/me with admin token
info "GET /auth/me as admin..."
RESP=$(request GET "/auth/me" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "GET /auth/me admin (HTTP ${CODE})"
else
  fail "GET /auth/me admin (HTTP ${CODE})" "$BODY"
fi

# 1.8 GET /auth/me without token (expect 401)
info "GET /auth/me without token (expect 401)..."
RESP=$(request GET "/auth/me" "")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "401" ]; then
  pass "Unauthenticated /me rejected (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 401, got ${CODE}" "$BODY"
fi

########################################
section "2. USERS - List / Get / Change Role"
########################################

# 2.1 List users as admin
info "GET /users as admin..."
RESP=$(request GET "/users?page=1&limit=10" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "List users admin (HTTP ${CODE})"
else
  fail "List users admin (HTTP ${CODE})" "$BODY"
fi

# 2.2 List users as worker (expect 403)
info "GET /users as worker (expect 403)..."
RESP=$(request GET "/users" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "List users forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 2.3 Get user by ID as admin
info "GET /users/${WORKER_ID} as admin..."
RESP=$(request GET "/users/${WORKER_ID}" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Get user by ID admin (HTTP ${CODE})"
else
  fail "Get user by ID admin (HTTP ${CODE})" "$BODY"
fi

# 2.4 Get self as worker
info "GET /users/${WORKER_ID} as worker (self)..."
RESP=$(request GET "/users/${WORKER_ID}" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Get self as worker (HTTP ${CODE})"
else
  fail "Get self as worker (HTTP ${CODE})" "$BODY"
fi

# 2.5 Get other user as worker (expect 403)
info "GET /users/${ADMIN_ID} as worker (expect 403)..."
RESP=$(request GET "/users/${ADMIN_ID}" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Get other user forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 2.6 Get non-existent user (expect 404)
info "GET /users/99999 (expect 404)..."
RESP=$(request GET "/users/99999" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Non-existent user returns 404 (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# 2.7 Change role as admin
info "PATCH /users/${WORKER_ID}/role to admin..."
RESP=$(request PATCH "/users/${WORKER_ID}/role" "$ADMIN_TOKEN" "{\"role\":\"admin\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Change role to admin (HTTP ${CODE})"
else
  fail "Change role (HTTP ${CODE})" "$BODY"
fi

# Revert role back to worker
info "PATCH /users/${WORKER_ID}/role back to worker..."
RESP=$(request PATCH "/users/${WORKER_ID}/role" "$ADMIN_TOKEN" "{\"role\":\"worker\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Revert role to worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Revert role (HTTP ${CODE})" "$BODY"
fi

# Re-login worker to get fresh token with worker role
info "Re-login worker after role revert..."
RESP=$(request POST "/auth/login" "" "{\"email\":\"${WORKER_EMAIL}\",\"password\":\"${WORKER_PASS}\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  WORKER_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  pass "Re-login worker (HTTP ${CODE})"
else
  fail "Re-login worker (HTTP ${CODE})" "$BODY"
fi

# 2.8 Change role as worker (expect 403)
info "PATCH /users/${WORKER_ID}/role as worker (expect 403)..."
RESP=$(request PATCH "/users/${WORKER_ID}/role" "$WORKER_TOKEN" "{\"role\":\"admin\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Change role forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 2.9 Change role with invalid value (expect 400)
info "PATCH /users/${WORKER_ID}/role with invalid role (expect 400)..."
RESP=$(request PATCH "/users/${WORKER_ID}/role" "$ADMIN_TOKEN" "{\"role\":\"superuser\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "400" ]; then
  pass "Invalid role rejected (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 400, got ${CODE}" "$BODY"
fi

########################################
section "3. TASKS - Create / List / Get / Update / Assign / Delete"
########################################

# 3.1 Create task as admin
info "POST /tasks as admin..."
RESP=$(request POST "/tasks" "$ADMIN_TOKEN" "{\"title\":\"Test Task ${TIMESTAMP}\",\"description\":\"Integration test task\",\"priority\":\"high\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "201" ]; then
  TASK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Create task (HTTP ${CODE}) - id=${TASK_ID}"
else
  fail "Create task (HTTP ${CODE})" "$BODY"
fi

# 3.2 Create task with assignee
info "POST /tasks with assignee..."
RESP=$(request POST "/tasks" "$ADMIN_TOKEN" "{\"title\":\"Assigned Task ${TIMESTAMP}\",\"priority\":\"medium\",\"assignee_id\":${WORKER_ID}}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "201" ]; then
  ASSIGNED_TASK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Create task with assignee (HTTP ${CODE}) - id=${ASSIGNED_TASK_ID}"
else
  fail "Create task with assignee (HTTP ${CODE})" "$BODY"
fi

# 3.3 Create task as worker (expect 403)
info "POST /tasks as worker (expect 403)..."
RESP=$(request POST "/tasks" "$WORKER_TOKEN" "{\"title\":\"Forbidden Task\",\"priority\":\"low\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Create task forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 3.4 Create task with invalid assignee (expect 404)
info "POST /tasks with non-existent assignee (expect 404)..."
RESP=$(request POST "/tasks" "$ADMIN_TOKEN" "{\"title\":\"Bad Assignee\",\"priority\":\"low\",\"assignee_id\":99999}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Non-existent assignee rejected (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# 3.5 List tasks as admin
info "GET /tasks as admin..."
RESP=$(request GET "/tasks?page=1&limit=10" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "List tasks admin (HTTP ${CODE})"
else
  fail "List tasks admin (HTTP ${CODE})" "$BODY"
fi

# 3.6 List tasks as worker (only assigned)
info "GET /tasks as worker..."
RESP=$(request GET "/tasks?page=1&limit=10" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "List tasks worker (HTTP ${CODE})"
else
  fail "List tasks worker (HTTP ${CODE})" "$BODY"
fi

# 3.7 Get task by ID as admin
info "GET /tasks/${TASK_ID} as admin..."
RESP=$(request GET "/tasks/${TASK_ID}" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Get task by ID admin (HTTP ${CODE})"
else
  fail "Get task by ID admin (HTTP ${CODE})" "$BODY"
fi

# 3.8 Get assigned task as worker
info "GET /tasks/${ASSIGNED_TASK_ID} as worker (assigned)..."
RESP=$(request GET "/tasks/${ASSIGNED_TASK_ID}" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Get assigned task as worker (HTTP ${CODE})"
else
  fail "Get assigned task as worker (HTTP ${CODE})" "$BODY"
fi

# 3.9 Get unassigned task as worker (expect 403)
info "GET /tasks/${TASK_ID} as worker (not assigned, expect 403)..."
RESP=$(request GET "/tasks/${TASK_ID}" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Unassigned task forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 3.10 Get non-existent task (expect 404)
info "GET /tasks/99999 (expect 404)..."
RESP=$(request GET "/tasks/99999" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Non-existent task returns 404 (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# 3.11 Update task as admin (all fields)
info "PATCH /tasks/${TASK_ID} as admin..."
RESP=$(request PATCH "/tasks/${TASK_ID}" "$ADMIN_TOKEN" "{\"title\":\"Updated Title\",\"status\":\"in_progress\",\"priority\":\"urgent\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Update task admin (HTTP ${CODE})"
else
  fail "Update task admin (HTTP ${CODE})" "$BODY"
fi

# 3.12 Update task as worker (status only)
info "PATCH /tasks/${ASSIGNED_TASK_ID} as worker (status only)..."
RESP=$(request PATCH "/tasks/${ASSIGNED_TASK_ID}" "$WORKER_TOKEN" "{\"status\":\"in_progress\"}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Update task status as worker (HTTP ${CODE})"
else
  fail "Update task status as worker (HTTP ${CODE})" "$BODY"
fi

# 3.13 Update unassigned task as worker (expect 403)
info "PATCH /tasks/${TASK_ID} as worker (not assigned, expect 403)..."
RESP=$(request PATCH "/tasks/${TASK_ID}" "$WORKER_TOKEN" "{\"status\":\"completed\"}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Update unassigned task forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 3.14 Assign task
info "PATCH /tasks/${TASK_ID}/assign to worker..."
RESP=$(request PATCH "/tasks/${TASK_ID}/assign" "$ADMIN_TOKEN" "{\"assignee_id\":${WORKER_ID}}")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Assign task (HTTP ${CODE})"
else
  fail "Assign task (HTTP ${CODE})" "$BODY"
fi

# 3.15 Assign task as worker (expect 403)
info "PATCH /tasks/${TASK_ID}/assign as worker (expect 403)..."
RESP=$(request PATCH "/tasks/${TASK_ID}/assign" "$WORKER_TOKEN" "{\"assignee_id\":${WORKER_ID}}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Assign task forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 3.16 Assign to non-existent user (expect 404)
info "PATCH /tasks/${TASK_ID}/assign to non-existent user (expect 404)..."
RESP=$(request PATCH "/tasks/${TASK_ID}/assign" "$ADMIN_TOKEN" "{\"assignee_id\":99999}")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Assign to non-existent user rejected (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# 3.17 Delete task as worker (expect 403)
info "DELETE /tasks/${ASSIGNED_TASK_ID} as worker (expect 403)..."
RESP=$(request DELETE "/tasks/${ASSIGNED_TASK_ID}" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "403" ]; then
  pass "Delete task forbidden for worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 403, got ${CODE}" "$BODY"
fi

# 3.18 Delete task as admin
info "DELETE /tasks/${ASSIGNED_TASK_ID} as admin..."
RESP=$(request DELETE "/tasks/${ASSIGNED_TASK_ID}" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP"); BODY=$(parse_body "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Delete task admin (HTTP ${CODE})"
else
  fail "Delete task admin (HTTP ${CODE})" "$BODY"
fi

# 3.19 Get deleted task (expect 404)
info "GET /tasks/${ASSIGNED_TASK_ID} after delete (expect 404)..."
RESP=$(request GET "/tasks/${ASSIGNED_TASK_ID}" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Deleted task returns 404 (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# 3.20 Delete non-existent task (expect 404)
info "DELETE /tasks/99999 (expect 404)..."
RESP=$(request DELETE "/tasks/99999" "$ADMIN_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "404" ]; then
  pass "Delete non-existent task returns 404 (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 404, got ${CODE}" "$BODY"
fi

# Clean up: delete the remaining test task
info "Cleanup: DELETE /tasks/${TASK_ID}..."
request DELETE "/tasks/${TASK_ID}" "$ADMIN_TOKEN" > /dev/null 2>&1

########################################
section "4. AUTH - Logout & Token Invalidation"
########################################

# 4.1 Logout worker
info "POST /auth/logout as worker..."
RESP=$(request POST "/auth/logout" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "200" ]; then
  pass "Logout worker (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Logout worker (HTTP ${CODE})" "$BODY"
fi

# 4.2 Use token after logout (expect 401)
info "GET /auth/me after logout (expect 401)..."
RESP=$(request GET "/auth/me" "$WORKER_TOKEN")
CODE=$(parse_code "$RESP")
if [ "$CODE" = "401" ]; then
  pass "Token invalidated after logout (HTTP ${CODE})"
else
  BODY=$(parse_body "$RESP")
  fail "Expected 401, got ${CODE}" "$BODY"
fi

########################################
# Summary
########################################
echo ""
echo -e "${CYAN}=====================================${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "  Total: ${TOTAL}  ${GREEN}Passed: ${PASSED}${NC}  ${RED}Failed: ${FAILED}${NC}"
echo -e "${CYAN}=====================================${NC}"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
