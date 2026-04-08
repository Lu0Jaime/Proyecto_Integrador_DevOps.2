# ══════════════════════════════════════════════════════════════
#  Dockerfile — Sistema de Gestión de Cartera Fiscal
#  Proyecto Integrador DevOps · Tecmilenio
#  Alumna: Lucero Sarahí Jaime Barbosa · Matrícula: 3069230
# ══════════════════════════════════════════════════════════════

# ── ETAPA 1: Instalar dependencias ──────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── ETAPA 2: Build de la aplicación ─────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno requeridas en tiempo de build (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ── ETAPA 3: Imagen de producción (ligera) ───────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo los archivos necesarios del build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
