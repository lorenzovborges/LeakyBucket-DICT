FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 4000

CMD ["/bin/sh", "./docker/entrypoint.sh"]
