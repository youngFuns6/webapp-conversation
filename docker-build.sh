#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# CentOS 7 默认 seccomp 会拦截 Next.js 15 构建所需系统调用，需关闭限制
docker build \
  --security-opt seccomp=unconfined \
  --build-arg "NEXT_PUBLIC_APP_ID=${NEXT_PUBLIC_APP_ID:-}" \
  --build-arg "NEXT_PUBLIC_APP_KEY=${NEXT_PUBLIC_APP_KEY:-}" \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://dify.dongnanedu.com/v1}" \
  --build-arg "NEXT_PUBLIC_ENABLE_USER_LOGIN=${NEXT_PUBLIC_ENABLE_USER_LOGIN:-false}" \
  -t webapp-conversation:latest \
  .
