# Leaky Bucket Platform

A full-stack project for Pix/DICT request-rate simulation, with a GraphQL backend in Node.js/Koa/TypeScript and a React + Relay frontend.

## Overview

The application has two main flows:

- `Legacy Pix`: simple per-tenant bucket (10 tokens, hourly refill).
- `DICT Engine`: policy-based engine with `USER` and `PSP` scopes, variable cost by operation/status, continuous refill, and HTTP `429` blocking when required.

The frontend consumes the GraphQL API and includes:

- tenant login (through a backend endpoint);
- Pix transaction simulation;
- DICT operation simulation;
- bucket monitoring.

## Stack

### Backend

- Node.js
- Koa
- TypeScript
- GraphQL Yoga
- Prisma v7 + PostgreSQL
- Jest + Supertest
- Newman (Postman)

### Frontend

- React
- Relay
- Vite
- TypeScript
- Vitest + Testing Library

## Features

### Backend

- HTTP API with `GET /health`, `POST /auth/demo-login`, `POST /graphql`
- Multi-tenant Bearer authentication
- Persisted token hashes (SHA-256)
- Legacy leaky bucket per tenant
- DICT engine with policies and idempotent credits
- HTTP `429` status mapping for rate-limit blocks
- Unit tests and real PostgreSQL integration tests (concurrency/locks)
- Postman collection ready to run

### Frontend

- Tenant A/B login without hardcoded tokens in the bundle
- Relay Environment created from backend-issued token
- Pix Transaction tab
- DICT Simulator tab
- Bucket Monitor tab

## Security

- `GRAPHQL_MASKED_ERRORS=true` by default (safe fallback when undefined)
- Bearer header required for GraphQL
- `ENABLE_DEMO_LOGIN` default by environment:
  - `development/test`: `true`
  - `production`: `false`

## Repository structure

- `backend/` API, Prisma, tests, and Postman
- `frontend/` React + Relay web application

Key files:

- `backend/src/server.ts`
- `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/modules/**`
- `backend/prisma/schema.prisma`
- `backend/prisma.config.ts`
- `backend/tests`
- `backend/tests-db`
- `backend/postman`
- `frontend/src/App.tsx`
- `frontend/src/auth/*`
- `frontend/src/pix/*`
- `frontend/src/dict/*`
- `frontend/src/buckets/*`

## Requirements

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Running locally

### 1) Clone and install dependencies

```bash
git clone <REPOSITORY_URL>
cd leakybucket

cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure backend environment

```bash
cd backend
cp .env.example .env
```

Important backend variables:

- `DATABASE_URL`
- `DATABASE_URL_DOCKER`
- `GRAPHQL_MASKED_ERRORS`
- `ENABLE_DEMO_LOGIN`
- `DEMO_TENANT_A_TOKEN`
- `DEMO_TENANT_B_TOKEN`
- `RUN_SEED_ON_START` (`false` by default for safe runtime)

### 3) Start PostgreSQL

Using Docker:

```bash
cd backend
docker compose up -d db
```

### 4) Run migrations and (optionally) seed

```bash
cd backend
npm run prisma:migrate:deploy
npm run prisma:seed
```

`prisma:seed` is idempotent (safe to run multiple times).  
Use `npm run prisma:seed:reset` only when you explicitly want to wipe and recreate demo data.

### 5) Start backend

```bash
cd backend
npm run dev
```

Backend: `http://localhost:4000`

### 6) Start frontend

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`

The frontend proxies backend requests for both `/graphql` and `/auth`.

## Docker execution (complete backend flow)

From `backend/`:

```bash
npm run docker:up
npm run docker:test
npm run docker:down
```

`docker:test` runs:

- lint
- fast test suite
- `test:db` (real PostgreSQL integration suite)
- build

## Execution matrix

- `dev local`: run DB + migrations; execute `prisma:seed` manually when you need demo fixtures.
- `docker demo`: set `RUN_SEED_ON_START=true` only for demo-like startup with auto seed.
- `test db`: use `npm run test:db` (self-contained migration flow).
- `production-like`: keep `RUN_SEED_ON_START=false` to avoid accidental data mutation at startup.

## Endpoints

### Health

- `GET /health`

### Demo login

- `POST /auth/demo-login`

Body:

```json
{ "tenantKey": "A" }
```

Response:

```json
{
  "tenant": {
    "name": "Tenant A",
    "category": "A",
    "capacity": "50,000"
  },
  "bearerToken": "tenant-a-secret"
}
```

### GraphQL

- `POST /graphql`
- Required header:

```text
Authorization: Bearer <token>
```

Seed tokens:

- Tenant A: `tenant-a-secret`
- Tenant B: `tenant-b-secret`

## Main GraphQL operations

### Legacy

- `myBucket`
- `queryPixKey`

`queryPixKey` input:

```graphql
input QueryPixKeyInput {
  pixKey: String!
  amountCents: Int!
}
```

### DICT

- `simulateDictOperation`
- `registerPaymentSent`
- `dictBucketState`
- `listDictBucketStates`

When DICT policies are exhausted, the API returns HTTP `429` with detailed payload.

## Testing

### Backend

Fast suite:

```bash
cd backend
npm run lint
npm test
npm run build
```

Real DB suite (self-contained):

```bash
cd backend
npm run test:db
```

`test:db` runs `prisma migrate deploy` before tests.

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run build
```

## Postman

Files:

- `backend/postman/LeakyBucket.postman_collection.json`
- `backend/postman/LeakyBucket.postman_environment.json`

Automated run:

```bash
cd backend
npm run postman:test
```

## Quick validation flow

```bash
# backend
cd backend
npm install
cp .env.example .env
npm run prisma:migrate:deploy
npm run prisma:seed
npm run lint
npm test
npm run test:db
npm run build
npm run postman:test

# frontend
cd ../frontend
npm install
npm run lint
npm test
npm run build
```
