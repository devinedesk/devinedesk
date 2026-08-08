# 🚀 DevineDesk Enterprise Deployment Guide

This guide outlines the infrastructure, deployment procedures, and CI/CD operations for the DevineDesk platform. The system is designed to run in a highly available, serverless, and horizontally scalable environment.

## 🏗 Infrastructure Overview

The DevineDesk platform utilizes the following managed services:

- **Compute**: Next.js App Router (Serverless Functions & Edge Network)
- **Database**: PostgreSQL (managed via Prisma ORM, e.g. Supabase, AWS RDS, or Neon)
- **Caching & Rate Limiting**: Redis (e.g. Upstash, AWS ElastiCache)
- **Object Storage**: AWS S3 (for AI generation assets, images, videos)
- **Background Jobs**: BullMQ via Redis (for long-running generation & webhook processing)
- **Security & Observability**: Sentry (Error tracking), Prometheus (Metrics)

---

## 🛠 Prerequisites

Before deploying to production, ensure you have the following keys and infrastructure provisioned:

### 1. Environment Variables

Copy `.env.example` to configure your production secrets securely in your CI/CD provider:

```bash
# Database & Caching
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
REDIS_URL="rediss://default:password@host:port"

# NextAuth Configuration
NEXTAUTH_URL="https://app.devinedesk.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# AWS S3 Storage
AWS_ACCESS_KEY_ID="<your-aws-access-key>"
AWS_SECRET_ACCESS_KEY="<your-aws-secret>"
S3_BUCKET_NAME="devinedesk-production-assets"
S3_ENDPOINT="<optional-custom-endpoint>"

# Subscriptions
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
INTERNAL_API_KEY="<secure-random-string>"
```

### 2. Infrastructure as Code (Terraform)

We have provided an automated Terraform configuration to provision the necessary AWS S3 Buckets with secure CORS configurations.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 🚀 Deployment Targets

### Option A: Vercel (Recommended)

Vercel provides native support for Next.js features, including ISR (Incremental Static Regeneration), Edge Middleware, and Serverless compute.

1. **Link Repository**: Import your GitHub repository into Vercel.
2. **Configure Build Command**:
   - Build Command: `npm run build`
   - Install Command: `npm install`
3. **Environment Variables**: Paste all required variables into the Vercel dashboard.
4. **Deploy**: Vercel will automatically trigger a deployment.

### Option B: AWS / Docker Container

If you prefer a self-hosted or ECS/EKS architecture, the repository contains a highly-optimized `Dockerfile`.

1. **Build the Image**:
   ```bash
   docker build -t devinedesk:latest .
   ```
2. **Run the Container**:
   ```bash
   docker run -d -p 3000:3000 \
     -e DATABASE_URL="<db_url>" \
     -e REDIS_URL="<redis_url>" \
     devinedesk:latest
   ```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The repository is configured with a robust Continuous Deployment pipeline located in `.github/workflows/cd.yml`.

- **Trigger**: The pipeline triggers on pushes to the `main` branch.
- **Process**: It automatically builds and pushes the Docker container to the GitHub Container Registry (`ghcr.io`).
- **Configuration**: Ensure you configure your `GITHUB_TOKEN` permissions in your repository settings to allow pushing to packages.

---

## 🔧 Post-Deployment Verification

Once deployed, use the following endpoints to verify system health:

1. **Health Check**: `GET https://<your-domain>/api/health`
   - _Should return a 200 OK with system telemetry and Redis connection states._
2. **Admin Fraud Dashboard**: Navigate to `/admin/fraud`
   - _Ensure it loads successfully without Prisma Connection errors (relies on correct dynamic rendering configuration)._
3. **Queue Worker**:
   - Verify that your background worker (`npm run worker` if using Docker, or Vercel Edge functions if using serverless) is successfully pulling from the BullMQ Redis queues.

---

## 🚨 Incident Response & Observability

- **Error Tracking**: All client, server, and Edge exceptions are automatically tracked in Sentry.
- **Fail-Open Architecture**: Rate limiting operates via a highly optimized Lua script in Redis. If Redis goes down, the system fails-open automatically to prevent global API outages.
- **Audit Logs**: All critical security events (logins, 2FA modifications, API Key generations, user bans) are permanently recorded in the `AuditLog` table.
