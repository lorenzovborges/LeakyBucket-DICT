#!/bin/sh
set -eu

printf '%s\n' 'Waiting for database and applying migrations...'
npm run prisma:migrate:deploy

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
  printf '%s\n' 'Seeding database...'
  node dist/prisma/seed.js
else
  printf '%s\n' 'Skipping seed (RUN_SEED_ON_START is not true).'
fi

printf '%s\n' 'Starting API server...'
exec node dist/src/server.js
