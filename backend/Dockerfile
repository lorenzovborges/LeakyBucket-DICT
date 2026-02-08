FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leakybucket?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run prisma:generate
RUN npm run build

EXPOSE 4000

CMD ["/bin/sh", "./docker/entrypoint.sh"]
