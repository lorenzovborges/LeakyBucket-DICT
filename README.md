# Woovi Leaky Bucket Challenge

Implementacao completa do desafio tecnico usando **Node.js + Koa + TypeScript + GraphQL** no backend e **React + Relay** no frontend, com estrategia de rate limit inspirada no DICT/BACEN.

## Tags

Backend, nodejs, api, graphql, security, pix, fintech

## Desafio original

### How would you develop a leaky bucket with nodejs, koa-js and typescript?

This challenge has as focus on implementing a leaky bucket strategy similar to the leaky bucket from BACEN.

### Deliverables

- A node js http server
- A multi-tenancy strategy to be the owner of requests. For example, you could have users, and each user will have 10 tokens
- Implement an authentication of users with a Bearer Token
- This token must be sent in the request Authorization
- A mutation that simulates a query of a pix key
- A leaky bucket strategy completed

### Leaky Bucket Strategy

- The query starts with 10 query tokens.
- Each request must consume 1 token. If success it keeps your token, if failed it must decrease 1 token from tokens.
- Every hour 1 token is added to the total number of tokens available for request
- 10 is the max limit of tokens
- Simulate requests validating token strategy with Jest to show that the leaky bucket works
- Generate a postman of the API to be consumed

### Bonus

- It uses GraphQL in the Node Server
- A frontend that simulates the initiation of a Pix transaction
- It will fill two fields: pix key and value
- It must request the backend GraphQL
- It must use React and Relay at the frontend

### Hard Core

Implement all Leaky Bucket from Dict:

[API DICT - Limitacao de requisicoes](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html#section/Seguranca/Limitacao-de-requisicoes)

---

## O que foi implementado

### Backend

- Servidor HTTP com Koa (`/health` e `/graphql`)
- GraphQL Yoga com autenticacao Bearer por tenant
- Multi-tenancy com PostgreSQL + Prisma
- Fluxo legado de consulta Pix com leaky bucket (10 tokens, refill por hora, limite maximo 10)
- Engine DICT hard-core isolada do legado
- Endpoint de login de demo para frontend: `POST /auth/demo-login`
- Postman collection com cenarios de legado + DICT
- Testes unitarios/integracao com Jest + Supertest
- Testes reais de lock e concorrencia com Prisma/Postgres (`tests-db`)

### Frontend

- React + Relay
- Tela de login por Tenant A / Tenant B
- Login via backend (`/auth/demo-login`) sem token hardcoded no bundle
- Simulacao de transacao Pix (chave + valor)
- Aba de simulacao DICT
- Aba de monitoramento de buckets
- Testes com Vitest + Testing Library

### Seguranca

- `GRAPHQL_MASKED_ERRORS=true` por padrao (na ausencia do env tambem assume `true`)
- Bearer token obrigatorio no GraphQL
- Token hash (SHA-256) persistido no banco
- `ENABLE_DEMO_LOGIN` com default seguro por ambiente:
  - `development/test`: `true`
  - `production`: `false`

---

## Estrutura do projeto

- `backend/` API GraphQL, Prisma, testes e Postman
- `frontend/` aplicacao React + Relay

Arquivos relevantes:

- `backend/src/server.ts`
- `backend/src/app.ts`
- `backend/src/config/env.ts`
- `backend/src/graphql/schema.ts`
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

---

## Requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

---

## Como baixar e rodar tudo (local)

### 1) Clonar e instalar dependencias

```bash
git clone <URL_DO_REPOSITORIO>
cd leakybucket

cd backend
npm install

cd ../frontend
npm install
```

### 2) Configurar backend

```bash
cd backend
cp .env.example .env
```

### 3) Subir banco Postgres

Opcao A (recomendado): via Docker

```bash
cd backend
docker compose up -d db
```

Opcao B: Postgres local externo (ajuste `DATABASE_URL` no `.env`)

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

Backend em: `http://localhost:4000`

### 6) Subir frontend

```bash
cd frontend
npm run dev
```

Frontend em: `http://localhost:3000`

O frontend usa proxy para o backend em `localhost:4000` (`/graphql` e `/auth`).

---

## Executar com Docker (backend completo)

No diretorio `backend/`:

```bash
npm run docker:up
npm run docker:test
npm run docker:down
```

O `docker:test` executa pipeline completa:

- lint
- testes rapidos
- `test:db` (integracao real com Postgres)
- build

---

## Endpoints e autenticacao

### Health

- `GET /health`

### Login demo (frontend)

- `POST /auth/demo-login`
- Body:

```json
{ "tenantKey": "A" }
```

- Response:

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

---

## Operacoes GraphQL principais

### Legacy

- `myBucket`
- `queryPixKey`

### DICT hard-core

- `simulateDictOperation`
- `registerPaymentSent`
- `dictBucketState`
- `listDictBucketStates`

Quando politicas DICT esgotam, a API retorna HTTP `429` e payload com detalhes de bloqueio.

---

## Matriz DICT (hard-core) implementada

- Catalogo de politicas completo
- Escopo `USER` e `PSP`
- Categorias PF/PJ e participante A..H
- Regras anti-scan por status (`200`, `404`, outros)
- Refill continuo de tokens
- Avaliacao atomica multi-politica com lock
- Bloqueio por saldo insuficiente (`429`)
- Credito de pagamento com idempotencia

---

## Testes

## Backend

Suite rapida:

```bash
cd backend
npm run lint
npm test
npm run build
```

Suite real com banco (autocontida):

```bash
cd backend
npm run test:db
```

`test:db` roda `prisma migrate deploy` automaticamente antes dos testes.

## Frontend

```bash
cd frontend
npm test
npm run build
```

---

## Postman

Arquivos:

- `backend/postman/LeakyBucket.postman_collection.json`
- `backend/postman/LeakyBucket.postman_environment.json`

Execucao automatizada:

```bash
cd backend
npm run postman:test
```

Ordem sugerida de execucao:

1. Health Check
2. Legacy (`My Bucket`, `Success`, `Failure`, `Rate Limited`)
3. DICT (`Simulate`, `Register Payment Sent`, `Get/List Bucket`, bloqueio, ineligible credit)

---

## Checklist rapido para avaliacao tecnica

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

---

## Observacoes finais

- A documentacao oficial do projeto passa a ser este `README.md` na raiz.
- O `README` antigo dentro de `backend/` foi removido para evitar duplicidade e divergencia.
