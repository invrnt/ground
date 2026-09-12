FROM node:24.21.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production HOST=0.0.0.0 WEB_DIST=/app/apps/web/dist PRIVATE_STORAGE_PATH=/storage/private
RUN mkdir -p /storage/private && chown -R node:node /storage
USER node
CMD ["node", "--import", "tsx", "apps/api/src/main.ts"]
