# Production Deployment Guide

This guide covers deploying the Sanity Studio Docker image to production environments.

## Prerequisites

- Docker installed
- Access to a container registry (Docker Hub, GitHub Container Registry, AWS ECR, etc.)
- Production Sanity project ID and dataset configured

## Building and Pushing the Image

### 1. Build the Image

```bash
# From the project root
docker build -f apps/studio/Dockerfile -t training-tool-studio:latest .
```

### 2. Tag for Your Registry

```bash
# Example for GitHub Container Registry
docker tag training-tool-studio:latest ghcr.io/your-org/training-tool-studio:latest

# Example for Docker Hub
docker tag training-tool-studio:latest your-username/training-tool-studio:latest

# Example for AWS ECR
docker tag training-tool-studio:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/training-tool-studio:latest
```

### 3. Push to Registry

```bash
# GitHub Container Registry
docker push ghcr.io/your-org/training-tool-studio:latest

# Docker Hub
docker push your-username/training-tool-studio:latest

# AWS ECR (after logging in)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/training-tool-studio:latest
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Simple Deployments)

1. Create a `.env.production` file:

```env
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_NAME=your-org/training-tool
IMAGE_TAG=v1.0.0
SANITY_STUDIO_PROJECT_ID=your-production-project-id
SANITY_STUDIO_DATASET=production
STUDIO_PORT=3333
```

2. Deploy:

```bash
docker-compose -f apps/studio/docker-compose.prod.yml --env-file .env.production up -d
```

### Option 2: Docker Run

```bash
docker run -d \
  --name training-tool-studio \
  -p 3333:3333 \
  -e SANITY_STUDIO_PROJECT_ID=your-production-project-id \
  -e SANITY_STUDIO_DATASET=production \
  --restart unless-stopped \
  ghcr.io/your-org/training-tool-studio:latest
```

### Option 3: Kubernetes

Create a `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: training-tool-studio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: training-tool-studio
  template:
    metadata:
      labels:
        app: training-tool-studio
    spec:
      containers:
      - name: studio
        image: ghcr.io/your-org/training-tool-studio:latest
        ports:
        - containerPort: 3333
        env:
        - name: SANITY_STUDIO_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: sanity-secrets
              key: project-id
        - name: SANITY_STUDIO_DATASET
          value: "production"
        - name: PORT
          value: "3333"
        - name: HOST
          value: "0.0.0.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /studio
            port: 3333
          initialDelaySeconds: 40
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /studio
            port: 3333
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: training-tool-studio-service
spec:
  selector:
    app: training-tool-studio
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3333
  type: LoadBalancer
```

### Option 4: Cloud Platforms

#### AWS ECS/Fargate

Use AWS ECS task definition with the image from ECR. Configure environment variables through ECS task definitions or AWS Secrets Manager.

#### Google Cloud Run

```bash
gcloud run deploy training-tool-studio \
  --image gcr.io/your-project/training-tool-studio:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SANITY_STUDIO_PROJECT_ID=your-project-id,SANITY_STUDIO_DATASET=production \
  --port 3333
```

#### Azure Container Instances

```bash
az container create \
  --resource-group your-resource-group \
  --name training-tool-studio \
  --image your-registry.azurecr.io/training-tool-studio:latest \
  --dns-name-label training-tool-studio \
  --ports 3333 \
  --environment-variables SANITY_STUDIO_PROJECT_ID=your-project-id SANITY_STUDIO_DATASET=production
```

## Environment Variables

Required environment variables:

- `SANITY_STUDIO_PROJECT_ID` - Your Sanity project ID (required)
- `SANITY_STUDIO_DATASET` - Dataset name (default: `production`)

Optional:

- `PORT` - Port to run on (default: `3333`)
- `HOST` - Host to bind to (default: `0.0.0.0`)

## Security Best Practices

1. **Never commit secrets**: Use environment variables or secrets management
2. **Use specific image tags**: Avoid `latest` in production, use version tags
3. **Run as non-root**: The Dockerfile should be updated to run as a non-root user
4. **Use secrets management**: Use Docker secrets, Kubernetes secrets, or cloud provider secrets managers
5. **Enable HTTPS**: Use a reverse proxy (nginx, Traefik) or cloud load balancer with SSL/TLS
6. **Network security**: Use Docker networks to isolate containers
7. **Resource limits**: Set CPU and memory limits to prevent resource exhaustion

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    paths:
      - 'apps/studio/**'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./apps/studio/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/studio:${{ github.sha }},ghcr.io/${{ github.repository }}/studio:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Monitoring and Health Checks

The container includes a healthcheck that verifies the `/studio` endpoint is accessible. Monitor:

- Container health status
- Application logs: `docker logs training-tool-studio`
- Resource usage: `docker stats training-tool-studio`
- Response times and error rates

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs training-tool-studio

# Check if port is already in use
lsof -i :3333

# Verify environment variables
docker inspect training-tool-studio | grep -A 10 Env
```

### Can't access the Studio

1. Verify port mapping: `docker ps` should show `0.0.0.0:3333->3333/tcp`
2. Check firewall rules
3. Verify the container is running: `docker ps`
4. Check application logs for errors

### Build failures

1. Ensure all dependencies are available
2. Check for local plugin dependencies (e.g., `@sanity/personalization-plugin`)
3. Verify pnpm lockfile is up to date

## Updating the Image

1. Build new version: `docker build -t training-tool-studio:v1.0.1 .`
2. Tag and push: `docker push ghcr.io/your-org/training-tool-studio:v1.0.1`
3. Update deployment to use new tag
4. Rolling update: `docker-compose pull && docker-compose up -d`

