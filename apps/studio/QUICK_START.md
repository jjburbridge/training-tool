# Quick Start - Production Deployment

## Build and Push

```bash
# 1. Build the image
docker build -f apps/studio/Dockerfile -t training-tool-studio:latest .

# 2. Tag for your registry (example: GitHub Container Registry)
docker tag training-tool-studio:latest ghcr.io/your-org/training-tool-studio:latest

# 3. Push to registry
docker push ghcr.io/your-org/training-tool-studio:latest
```

## Deploy with Docker Compose

```bash
# Create .env.production file
cat > .env.production << EOF
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_NAME=your-org/training-tool
IMAGE_TAG=latest
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
STUDIO_PORT=3333
EOF

# Deploy
docker-compose -f apps/studio/docker-compose.prod.yml --env-file .env.production up -d
```

## Deploy with Docker Run

```bash
docker run -d \
  --name training-tool-studio \
  -p 3333:3333 \
  -e SANITY_STUDIO_PROJECT_ID=your-project-id \
  -e SANITY_STUDIO_DATASET=production \
  --restart unless-stopped \
  ghcr.io/your-org/training-tool-studio:latest
```

## Verify Deployment

```bash
# Check container status
docker ps

# View logs
docker logs training-tool-studio

# Test health endpoint
curl http://localhost:3333/studio
```

## Access the Studio

Open your browser to: `http://your-server:3333/studio`

For production, ensure you:
- Set up HTTPS via reverse proxy (nginx, Traefik, or cloud load balancer)
- Configure proper firewall rules
- Use secrets management for sensitive environment variables

