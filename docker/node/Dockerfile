FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install 2>/dev/null || true

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]