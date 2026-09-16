# ==============================================================================
# Dockerfile Multietapa Optimizado para Producción (Next.js Standalone + Prisma)
# ==============================================================================

# 1. Base Image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencias de Construcción
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
RUN npm ci

# 3. Compilación (Builder)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente de Prisma y compilar Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# 4. Dependencias Ligeras de Producción (para CLI de Prisma, tsx y scripts de mantenimiento)
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# 5. Imagen de Ejecución Ligera (Runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario sin privilegios por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Precrear directorios de uploads y cache con permisos correctos para usuario nextjs
RUN mkdir -p /app/public/uploads /app/.next \
  && chown -R nextjs:nodejs /app/public /app/.next

# Copiar archivos públicos y estáticos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar artefactos standalone producidos por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar dependencias de producción completas (permite ejecutar CLI de Prisma y tsx)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar esquemas de Prisma, cliente generado, scripts e inventario para operaciones de BD
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copiar script de entrada (entrypoint) para migraciones automáticas
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Cambiar a usuario no-root
USER nextjs

EXPOSE 3000

# Verificación de salud del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
