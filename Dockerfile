FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
ENV HUSKY=0
RUN npm config set registry https://registry.npmmirror.com \
  && npm install --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_ID
ARG NEXT_PUBLIC_APP_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_USER_LOGIN=false
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID
ENV NEXT_PUBLIC_APP_KEY=$NEXT_PUBLIC_APP_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENABLE_USER_LOGIN=$NEXT_PUBLIC_ENABLE_USER_LOGIN
ENV HUSKY=0

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
