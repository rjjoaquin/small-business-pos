FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci && npm rebuild better-sqlite3

COPY . .
RUN npm run build \
  && mkdir -p /app/data \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/pos.sqlite
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
