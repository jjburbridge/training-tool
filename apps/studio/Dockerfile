# Use Node.js LTS version
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy packages that the studio depends on  - can probably ignore this
COPY packages ./packages

# Copy studio app - due to being in a monorepo this is the path to the studio app if just studio repo then would be . .
COPY apps/studio ./apps/studio

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the studio 
WORKDIR /app/apps/studio
RUN pnpm build

# Production stage - use nginx to serve static files
FROM nginx:alpine AS runtime

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy nginx configuration
COPY apps/studio/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from the build stage
COPY --from=base /app/apps/studio/dist /usr/share/nginx/html

# Expose the default Sanity Studio port
EXPOSE 3333

# Health check - verify nginx is serving the studio
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3333/studio || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

