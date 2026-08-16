# ============================================================
# Stage 1 - BUILD
# Injects frontend configuration (VAPI public key & assistant
# ID) into index.html at build time using sed substitution.
# These are NOT secrets - they ship to the browser anyway.
# ============================================================
FROM node:20-alpine AS build

# Frontend-only keys passed as Docker build arguments.
# Supply them with:
#   docker build \
#     --build-arg VAPI_PUBLIC_KEY=pk_... \
#     --build-arg ASSISTANT_ID=ast_...  \
#     -t kapture-mock-server .
ARG VAPI_PUBLIC_KEY=REPLACE_WITH_YOUR_VAPI_PUBLIC_KEY
ARG ASSISTANT_ID=REPLACE_WITH_YOUR_INBOUND_ASSISTANT_ID

WORKDIR /build

COPY index.html ./

RUN sed -i \
      -e "s|REPLACE_WITH_YOUR_VAPI_PUBLIC_KEY|${VAPI_PUBLIC_KEY}|g" \
      -e "s|REPLACE_WITH_YOUR_INBOUND_ASSISTANT_ID|${ASSISTANT_ID}|g" \
      index.html

# ============================================================
# Stage 2 - DEPENDENCIES
# Installs only production npm packages (no ngrok, no dev).
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev --ignore-scripts

# ============================================================
# Stage 3 - PRODUCTION
# Final lean image: app source + prod deps + processed HTML.
# ============================================================
FROM node:20-alpine AS production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY app.js server.js package.json ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY data/ ./data/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/

COPY --from=build /build/index.html ./public/index.html

ENV PORT=3000
ENV VAPI_SHARED_SECRET=""

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]