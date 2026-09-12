FROM node:24.21.0-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production HOST=0.0.0.0 WEB_DIST=/app/apps/web/dist PRIVATE_STORAGE_PATH=/storage/private
USER node
CMD ["pnpm", "--filter", "@ground/api", "exec", "tsx", "src/main.ts"]
