# Leaky Bucket Platform

Projeto full-stack para simulacao de limites de requisicao em Pix/DICT, com backend GraphQL em Node.js/Koa/TypeScript e frontend React + Relay.

## Visao geral

A aplicacao possui dois fluxos principais:

- `Legacy Pix`: bucket simples por tenant (10 tokens, refill por hora).
- `DICT Engine`: motor de politicas com escopo `USER` e `PSP`, custo variavel por operacao/status, refill continuo e bloqueio HTTP `429` quando necessario.

O frontend consome a API GraphQL e inclui:

- login por tenant (via endpoint backend);
- simulacao de transacao Pix;
- simulacao de operacoes DICT;
- monitoramento de buckets.

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

## Funcionalidades

### Backend

- API HTTP com endpoints `GET /health`, `POST /auth/demo-login`, `POST /graphql`
- Multi-tenancy com autenticacao Bearer
- Token hash persistido (SHA-256)
- Leaky bucket legado por tenant
- Engine DICT com politicas e creditos idempotentes
- Ajuste de status HTTP `429` para bloqueios de rate limit
- Testes unitarios e integracoes reais com Postgres (concorrencia/locks)
- Colecao Postman pronta para execucao

### Frontend

- Login por Tenant A/B sem token hardcoded no bundle
- Relay Environment criado com token recebido do backend
- Aba Pix Transaction
- Aba DICT Simulator
- Aba Bucket Monitor

## Seguranca

- `GRAPHQL_MASKED_ERRORS=true` por padrao (fallback seguro quando ausente)
- Header Bearer obrigatorio para GraphQL
- `ENABLE_DEMO_LOGIN` com default por ambiente:
  - `development/test`: `true`
  - `production`: `false`

## Estrutura do repositorio

- `backend/` API, Prisma, testes e Postman
- `frontend/` aplicacao web React + Relay

Arquivos-chave:

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

## Requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Como rodar localmente

### 1) Clonar e instalar dependencias

```bash
git clone <URL_DO_REPOSITORIO>
cd leakybucket

cd backend
npm install

cd ../frontend
npm install
```

### 2) Configurar ambiente do backend

```bash
cd backend
cp .env.example .env
```

Variaveis importantes no backend:

- `DATABASE_URL`
- `DATABASE_URL_DOCKER`
- `GRAPHQL_MASKED_ERRORS`
- `ENABLE_DEMO_LOGIN`
- `DEMO_TENANT_A_TOKEN`
- `DEMO_TENANT_B_TOKEN`

### 3) Subir Postgres

Via Docker:

```bash
cd backend
docker compose up -d db
```

### 4) Aplicar migrations e seed

```bash
cd backend
npm run prisma:migrate:deploy
npm run prisma:seed
```

### 5) Subir backend

```bash
cd backend
npm run dev
```

Backend: `http://localhost:4000`

### 6) Subir frontend

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`

O frontend usa proxy para o backend (`/graphql` e `/auth`).

## Execucao com Docker (backend completo)

No diretorio `backend/`:

```bash
npm run docker:up
npm run docker:test
npm run docker:down
```

`docker:test` executa:

- lint
- testes rapidos
- `test:db` (integracao real com Postgres)
- build

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
- Header obrigatorio:

```text
Authorization: Bearer <token>
```

Tokens de seed:

- Tenant A: `tenant-a-secret`
- Tenant B: `tenant-b-secret`

## Operacoes GraphQL principais

### Legacy

- `myBucket`
- `queryPixKey`

### DICT

- `simulateDictOperation`
- `registerPaymentSent`
- `dictBucketState`
- `listDictBucketStates`

Quando politicas DICT esgotam, a API retorna HTTP `429` com payload detalhado.

## Testes

### Backend

Suite rapida:

```bash
cd backend
npm run lint
npm test
npm run build
```

Suite real de banco (autocontida):

```bash
cd backend
npm run test:db
```

`test:db` executa `prisma migrate deploy` antes dos testes.

### Frontend

```bash
cd frontend
npm test
npm run build
```

## Postman

Arquivos:

- `backend/postman/LeakyBucket.postman_collection.json`
- `backend/postman/LeakyBucket.postman_environment.json`

Execucao automatizada:

```bash
cd backend
npm run postman:test
```

## Fluxo rapido de validacao

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
npm test
npm run build
```
