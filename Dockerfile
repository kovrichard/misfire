# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.3.13 AS base

WORKDIR /app

# The bun image resolves `node` to bun itself, and Next 16.3 needs a real one: bun
# segfaults at the end of `next build`, and its standalone server rejects
# next-server/app-page-turbo.runtime.prod.js with "Expected CommonJS module to have a
# function wrapper", which 500s every SSR route. apt's node takes PATH precedence over
# bun's fallback shim, so both the build and the server land on it.
# ca-certificates isn't in this base image; without it node's TLS client rejects every
# HTTPS request with UNABLE_TO_GET_ISSUER_CERT_LOCALLY, which breaks Prisma's postinstall
# engine download.
RUN apt update -y && apt install -y --no-install-recommends nodejs ca-certificates && rm -rf /var/lib/apt/lists/*

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install

RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
WORKDIR /temp/dev
RUN bun install --frozen-lockfile
WORKDIR /app

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
WORKDIR /temp/prod
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM base AS prerelease

COPY --from=install /temp/dev/node_modules node_modules

COPY ./public ./public
COPY ./src ./src
COPY package.json bun.lock ./
COPY ./next.config.mjs next.config.mjs
COPY postcss.config.mjs postcss.config.mjs
COPY tsconfig.json tsconfig.json

# Deploy target. src/lib/config.ts reads it at module scope, so the prerendered
# shell (robots meta, analytics gate) freezes it here at build time rather than
# picking it up from the runtime environment.
ARG ENVIRONMENT

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV ENVIRONMENT=$ENVIRONMENT

RUN bun run build:standalone

FROM base AS release

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN useradd --system --uid 1001 nextjs

# Copy files as root:root (default), then set permissions for nextjs to read/execute only
COPY --from=prerelease --chmod=755 /app/public ./public
COPY --from=prerelease --chmod=755 /app/.next/standalone ./
COPY --from=prerelease --chmod=755 /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "./server.js"]

FROM base AS dev

# copy the installed dependencies from the install stage
COPY --from=install /temp/dev/node_modules node_modules
