# syntax=docker/dockerfile:1.24.0@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89
# check=error=true

ARG NODE_IMAGE=scratch
ARG NGINX_IMAGE=scratch

FROM ${NODE_IMAGE} AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,id=parkventory-npm,target=/root/.npm,sharing=locked \
    npm ci --ignore-scripts --no-audit --no-fund

COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./frontend/
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src

RUN VITE_BASE_PATH=/ \
    VITE_API_BASE_URL=/api/v1 \
    VITE_DEMO_MODE=false \
    npm run frontend:build \
    && printf 'parkventory-frontend-v1\n' >frontend/dist/__health

FROM ${NGINX_IMAGE} AS runtime
COPY infra/images/frontend-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /workspace/frontend/dist/ /usr/share/nginx/html/

USER 101:101
EXPOSE 8080
