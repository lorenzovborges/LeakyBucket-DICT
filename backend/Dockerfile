FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
