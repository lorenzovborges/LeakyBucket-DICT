# Leaky Bucket Challenge (Backend)

Backend implementation of the Leaky Bucket challenge using Node.js, Koa, GraphQL Yoga, TypeScript and Prisma.

## What is implemented

- Node.js HTTP server with Koa.
- GraphQL API (`/graphql`) with Bearer authentication per tenant.
- Multi-tenancy model using PostgreSQL + Prisma.
- Legacy and DICT engines are isolated (no shared business logic path).
- Legacy leaky bucket strategy:
  - starts with 10 tokens;
  - every request validates available tokens;
  - successful pix key query keeps tokens;
  - failed query consumes 1 token;
  - every elapsed hour refills 1 token;
  - max limit is always 10.
- DICT hard-core token bucket engine:
  - policies by operation and scope (`USER`, `PSP`);
  - categorized buckets for `PF/PJ` and participant category (`A..H`);
  - anti-scan rules for `getEntry` with status-based variable costs;
  - role-based policies (`*_WITH_ROLE`, `*_WITHOUT_ROLE`);
  - continuous refill (`elapsedSeconds * refillPerSecond`);
  - HTTP `429` when any applicable policy is exhausted in `simulateDictOperation`;
  - GraphQL payload still includes `allowed=false`, `httpStatus=429`, and `blockedByPolicies`;
  - payment credit flow via `registerPaymentSent`.
- Mutations for legacy flow and DICT simulation.
- Automated tests with Jest (legacy + DICT unit and integration coverage).
- Postman collection and environment under `/postman`.

## Tech stack

- Node.js
- Koa
- TypeScript (strict)
- GraphQL Yoga
- Prisma ORM + PostgreSQL
- Jest + Supertest
- Pino

## Project structure

- `backend/src/server.ts`
- `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/graphql/schema.ts`
- `backend/src/graphql/context.ts`
- `backend/src/modules/auth/auth.middleware.ts`
- `backend/src/modules/dict/dict-rate-limit.service.ts`
- `backend/src/modules/dict/dict.repository.ts`
- `backend/src/modules/dict/policy-catalog.ts`
- `backend/src/modules/dict/policy-resolver.ts`
- `backend/src/modules/dict/cost-calculator.ts`
- `backend/src/modules/dict/token-bucket-engine.ts`
- `backend/src/modules/tenant/tenant.repository.ts`
- `backend/src/modules/pix/pix.service.ts`
- `backend/src/modules/leakybucket/leakybucket.service.ts`
- `backend/src/modules/leakybucket/leakybucket.repository.ts`
- `backend/src/modules/leakybucket/leakybucket.types.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260208010000_dict_hardcore/migration.sql`
- `backend/prisma/seed.ts`
- `backend/tests`
- `backend/postman`

## Local setup

Run from the backend workspace:

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

For schema changes in development, use:

```bash
npm run prisma:migrate -- --name <migration_name>
```

Server endpoints:

- REST health: `GET /health`
- GraphQL endpoint: `POST /graphql`

## Docker Compose (app + db + tests)

The project is ready to run everything with Docker Compose:

1. Ensure Docker is running.
2. Build and start API + PostgreSQL (from `backend/`):

```bash
npm run docker:up
```

3. Run test pipeline inside compose (lint + test + build):

```bash
npm run docker:test
```

4. Stop and remove containers/volume:

```bash
npm run docker:down
```

Compose services:

- `db`: PostgreSQL 16 with healthcheck
- `app`: API container (runs `prisma migrate deploy`, optional seed, then starts server)
- `test`: validation container (lint + tests + build), available through `test` profile

Important env vars (already in `.env.example`):

- `DATABASE_URL`: local host execution URL
- `DATABASE_URL_DOCKER`: compose internal URL (`db` host)
- `RUN_SEED_ON_START`: `true` or `false` to control seed on container startup

## Auth and demo tokens

Send header in every GraphQL request:

```text
Authorization: Bearer <token>
```

Seed tokens:

- Tenant A: `tenant-a-secret`
- Tenant B: `tenant-b-secret`

Tokens are stored hashed (`SHA-256`) in database.

## GraphQL operations

### Query: myBucket

```graphql
query {
  myBucket {
    availableTokens
    maxTokens
    lastRefillAt
  }
}
```

### Mutation: queryPixKey

```graphql
mutation QueryPix($input: QueryPixKeyInput!) {
  queryPixKey(input: $input) {
    status
    message
    pixKeyFound
    ownerName
    bankName
    availableTokens
    maxTokens
    consumedToken
    requestedAt
  }
}
```

Variables example:

```json
{
  "input": {
    "pixKey": "valid-pix-key-001",
    "amount": 120.55
  }
}
```

### Mutation: simulateDictOperation

```graphql
mutation Simulate($input: SimulateDictOperationInput!) {
  simulateDictOperation(input: $input) {
    allowed
    httpStatus
    blockedByPolicies
    impacts {
      policyCode
      scopeType
      scopeKey
      costApplied
      tokensBefore
      tokensAfter
      capacity
      refillPerSecond
    }
  }
}
```

When DICT policies are exhausted, HTTP response status is `429` and the payload keeps the simulation details.

Variables example (`GET_ENTRY`):

```json
{
  "input": {
    "operation": "GET_ENTRY",
    "simulatedStatusCode": 404,
    "payerId": "12345678901",
    "keyType": "EMAIL",
    "endToEndId": "E2E-ABC-001"
  }
}
```

### Mutation: registerPaymentSent

```graphql
mutation RegisterPayment($input: RegisterPaymentSentInput!) {
  registerPaymentSent(input: $input) {
    credited
    reason
    impacts {
      policyCode
      costApplied
      tokensBefore
      tokensAfter
    }
  }
}
```

Credit eligibility rule:

- credit is applied only when there is an eligible `GET_ENTRY` trace (`allowed=true` and `simulatedStatusCode=200`);
- ineligible/missing trace returns `credited=false` with `reason=ENTRY_LOOKUP_NOT_ELIGIBLE`;
- repeated credit for the same key is idempotent with `reason=PAYMENT_ALREADY_REGISTERED`.

## Legacy x DICT separation

- Legacy entrypoints:
  - `queryPixKey` and `myBucket`, backed by `LeakyBucketService`.
- DICT entrypoints:
  - `simulateDictOperation`, `registerPaymentSent`, `dictBucketState`, `listDictBucketStates`, backed by `DictRateLimitService`.
- Services are wired independently in server bootstrapping, so DICT hard-core changes do not alter legacy token semantics.

## DICT compliance matrix (implemented)

| Area | Status |
|---|---|
| All policy codes from DICT table | Implemented in catalog |
| USER/PSP scope partitioning | Implemented (`tenantId:payerId` and `tenantId`) |
| PF/PJ user categories | Implemented |
| Participant categories A..H | Implemented |
| Anti-scan status costs (200/404/others) | Implemented |
| Default policy counting (`status != 500`) | Implemented |
| Continuous refill and capacity clamp | Implemented |
| Atomic multi-policy evaluation with lock | Implemented |
| Block on any insufficient policy | Implemented with HTTP 429 |
| Payment credit with idempotency | Implemented |

## DICT scope in this project

This project implements the hard-core DICT rate-limit engine (policy resolution, bucket accounting, scope partitioning, anti-scan costs and credits) in simulation mode.

- DICT operation business domains (`claims`, `refunds`, `infractions`, etc.) are simulated only for rate-limit behavior.
- `simulatedStatusCode` is intentionally part of the input to validate policy counting rules.
- This is not a production DICT protocol integration with BACEN transport/auth contracts.

### Query: dictBucketState / listDictBucketStates

```graphql
query Bucket($input: DictBucketStateInput!) {
  dictBucketState(input: $input) {
    policyCode
    scopeType
    scopeKey
    tokens
    capacity
    refillPerSecond
    lastRefillAt
  }
}
```

## Run tests

```bash
npm run lint
npm test
npm test -- --coverage
npm run build
```

## Postman

Import:

- `backend/postman/LeakyBucket.postman_collection.json`
- `backend/postman/LeakyBucket.postman_environment.json`

The collection is state-aware and has `pm.test` assertions in all requests.

Recommended execution order:

1. Health Check
2. Legacy requests (`My Bucket`, `Success`, `Failure`, `Rate Limited Scenario`)
3. DICT requests (`Simulate 200`, `Register Payment Sent`, `Get/List Bucket`, blocked scenario, ineligible credit)

Automated run with Newman:

```bash
npm run postman:test
```

## 5-minute evaluator checklist

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate:deploy
npm run prisma:seed
npm run lint
npm test -- --coverage
npm run build
npm run docker:up
npm run docker:test
npm run postman:test
```
