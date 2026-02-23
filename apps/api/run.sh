#!/usr/bin/env sh

echo "Start server..."

npx prisma migrate deploy --config=prisma/prisma.config.ts

node /app/dist/apps/api/main.js
