# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the Next.js quickstart.
#
# Produces a small runtime image using Next.js' "standalone" output (see
# next.config.ts). No secrets are baked into the image — every credential is
# supplied at runtime via environment variables (see .env.example / README),
# which is what makes this image safe to build from a PUBLIC repo and deploy to
# your own GCP project.
# ---------------------------------------------------------------------------

# ---- deps: install production-ready node_modules using the lockfile ----------
FROM node:20-alpine AS deps
WORKDIR /app
# libc compat for some native deps under alpine.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app --------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Telemetry is opt-out; disable it for reproducible, network-free builds.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal image that runs the standalone server ------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run (and most PaaS) inject PORT; bind to all interfaces so it's reachable.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone output includes a minimal server.js plus only the traced
# node_modules it actually needs.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
