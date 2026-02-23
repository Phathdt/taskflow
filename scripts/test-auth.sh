#!/bin/bash
# Auth flow integration test script
# Usage: ./scripts/test-auth.sh [BASE_URL]

BASE_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
EMAIL="testuser-${TIMESTAMP}@example.com"
PASSWORD="Test@123456"
NAME="Test User"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; echo "  Response: $2"; exit 1; }
info() { echo -e "${YELLOW}INFO${NC}: $1"; }

echo "=== Auth Flow Test ==="
echo "Base URL: ${BASE_URL}"
echo "Email:    ${EMAIL}"
echo ""

# 1. Register
info "1. Register new user..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"name\":\"${NAME}\"}")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')
REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -1)

if [ "$REGISTER_CODE" = "201" ]; then
  pass "Register (HTTP ${REGISTER_CODE})"
  echo "  $REGISTER_BODY" | head -1
else
  fail "Register (HTTP ${REGISTER_CODE})" "$REGISTER_BODY"
fi
echo ""

# 2. Register duplicate (should fail)
info "2. Register duplicate email (expect 409)..."
DUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"name\":\"${NAME}\"}")

DUP_CODE=$(echo "$DUP_RESPONSE" | tail -1)

if [ "$DUP_CODE" = "409" ]; then
  pass "Duplicate register rejected (HTTP ${DUP_CODE})"
else
  DUP_BODY=$(echo "$DUP_RESPONSE" | sed '$d')
  fail "Duplicate register should return 409, got ${DUP_CODE}" "$DUP_BODY"
fi
echo ""

# 3. Login
info "3. Login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)

if [ "$LOGIN_CODE" = "200" ]; then
  ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$ACCESS_TOKEN" ]; then
    pass "Login (HTTP ${LOGIN_CODE}) - token received"
  else
    fail "Login - no access_token in response" "$LOGIN_BODY"
  fi
else
  fail "Login (HTTP ${LOGIN_CODE})" "$LOGIN_BODY"
fi
echo ""

# 4. Get /me with token
info "4. Get /auth/me (authenticated)..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')
ME_CODE=$(echo "$ME_RESPONSE" | tail -1)

if [ "$ME_CODE" = "200" ]; then
  pass "Get /me (HTTP ${ME_CODE})"
  echo "  $ME_BODY" | head -1
else
  fail "Get /me (HTTP ${ME_CODE})" "$ME_BODY"
fi
echo ""

# 5. Get /me without token (should fail)
info "5. Get /auth/me without token (expect 401)..."
NOAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/auth/me")
NOAUTH_CODE=$(echo "$NOAUTH_RESPONSE" | tail -1)

if [ "$NOAUTH_CODE" = "401" ]; then
  pass "Unauthenticated request rejected (HTTP ${NOAUTH_CODE})"
else
  NOAUTH_BODY=$(echo "$NOAUTH_RESPONSE" | sed '$d')
  fail "Should return 401, got ${NOAUTH_CODE}" "$NOAUTH_BODY"
fi
echo ""

# 6. Login with wrong password (should fail)
info "6. Login with wrong password (expect 401)..."
WRONG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"wrongpassword\"}")

WRONG_CODE=$(echo "$WRONG_RESPONSE" | tail -1)

if [ "$WRONG_CODE" = "401" ]; then
  pass "Wrong password rejected (HTTP ${WRONG_CODE})"
else
  WRONG_BODY=$(echo "$WRONG_RESPONSE" | sed '$d')
  fail "Should return 401, got ${WRONG_CODE}" "$WRONG_BODY"
fi
echo ""

# 7. Logout
info "7. Logout..."
LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/logout" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

LOGOUT_BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')
LOGOUT_CODE=$(echo "$LOGOUT_RESPONSE" | tail -1)

if [ "$LOGOUT_CODE" = "200" ]; then
  pass "Logout (HTTP ${LOGOUT_CODE})"
else
  fail "Logout (HTTP ${LOGOUT_CODE})" "$LOGOUT_BODY"
fi
echo ""

# 8. Get /me after logout (should fail - session invalidated)
info "8. Get /auth/me after logout (expect 401)..."
POSTLOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

POSTLOGOUT_CODE=$(echo "$POSTLOGOUT_RESPONSE" | tail -1)

if [ "$POSTLOGOUT_CODE" = "401" ]; then
  pass "Post-logout request rejected (HTTP ${POSTLOGOUT_CODE})"
else
  POSTLOGOUT_BODY=$(echo "$POSTLOGOUT_RESPONSE" | sed '$d')
  fail "Should return 401 after logout, got ${POSTLOGOUT_CODE}" "$POSTLOGOUT_BODY"
fi
echo ""

echo "=== All tests passed ==="
