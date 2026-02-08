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
- In-memory persistence
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
- Unit tests with in-memory repositories
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

- `backend/` API, tests, and Postman
- `frontend/` React + Relay web application

Key files:

- `backend/src/server.ts`
- `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/seed.ts`
- `backend/src/modules/**`
- `backend/tests`
- `backend/postman`
- `frontend/src/App.tsx`
- `frontend/src/auth/*`
- `frontend/src/pix/*`
- `frontend/src/dict/*`
- `frontend/src/buckets/*`

## Requirements

- Node.js 20+
- npm 10+
- Docker + Docker Compose (optional, for containerized deployment)

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

- `GRAPHQL_MASKED_ERRORS`
- `ENABLE_DEMO_LOGIN`
- `DEMO_TENANT_A_TOKEN`
- `DEMO_TENANT_B_TOKEN`

### 3) Start backend

```bash
cd backend
npm run dev
```

Backend: `http://localhost:4000`

Data lives in-memory and resets on server restart.

### 4) Start frontend

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`

The frontend proxies backend requests for both `/graphql` and `/auth`.

## Docker execution

From `backend/`:

```bash
npm run docker:up
npm run docker:down
```

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

```bash
cd backend
npm run lint
npm test
npm run build
```

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
npm run lint
npm test
npm run build

# frontend
cd ../frontend
npm install
npm run lint
npm test
npm run build
```
