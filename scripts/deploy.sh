#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "=== DevineDesk Deployment ==="

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found."
  echo "Copy .env.production.example to .env.production and fill in all values."
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker first."
  exit 1
fi

echo "1/5: Pulling latest code..."
git pull --rebase 2>/dev/null || true

echo "2/5: Building images..."
docker compose -f docker-compose.prod.yml build

echo "3/5: Starting services..."
docker compose -f docker-compose.prod.yml up -d postgres minio backend frontend proxy certbot

echo "4/5: Waiting for backend to be healthy..."
for i in $(seq 1 30); do
  if curl -fsS http://localhost:4000/health > /dev/null 2>&1; then
    echo "Backend is healthy!"
    break
  fi
  echo "  Waiting... ($i/30)"
  sleep 5
done

echo "5/5: Obtaining SSL certificate..."
DOMAIN=$(grep BACKEND_URL .env.production | cut -d= -f2 | sed 's|https://||;s|/.*||;s|api\.||')
if [ -n "$DOMAIN" ]; then
  echo "Obtaining SSL cert for $DOMAIN..."
  docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot -w /var/www/certbot \
    --email "support@devinedesk.com" \
    --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "app.$DOMAIN" -d "api.$DOMAIN" -d "minio.$DOMAIN"
  docker compose -f docker-compose.prod.yml restart proxy
else
  echo "WARNING: Could not determine domain. SSL setup skipped."
fi

echo "=== Deployment complete! ==="
docker compose -f docker-compose.prod.yml ps
echo ""
echo "To start FaceFusion: docker compose -f docker-compose.prod.yml --profile facefusion up -d facefusion"
