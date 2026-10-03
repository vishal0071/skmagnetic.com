# syntax=docker/dockerfile:1
# SK Enterprises website — nginx serving the published static site.
# The admin service (Dockerfile.admin) rebuilds the site and switches /srv/site/current;
# this image only bakes an initial build so the site is up even before the first publish.

FROM node:22-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /srv/site/releases/00000000-000000
RUN ln -s releases/00000000-000000 /srv/site/current
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --spider http://127.0.0.1/ || exit 1
