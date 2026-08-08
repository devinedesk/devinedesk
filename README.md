<div align="center">
  <img src="public/icon.png" width="128" alt="DevineDesk Logo">
  <h1>DevineDesk Platform</h1>
  <p><strong>The Enterprise-Grade AI Workflow Automation SaaS</strong></p>

[![Build Status](https://github.com/avaspatel/devinedesk/workflows/Devinedesk%20CI/CD/badge.svg)](https://github.com/avaspatel/devinedesk/actions)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 🚀 Overview

DevineDesk is a massively scalable, serverless-first SaaS platform designed to automate AI-driven workflows. Engineered from the ground up for **performance, security, and developer velocity**, it supports highly concurrent background processing, complex Role-Based Access Control (RBAC), multi-tenant organization workspaces, and a native desktop experience.

Whether you're generating AI assets via pipelines, managing a 10,000-user enterprise organization, or diving into real-time metrics, DevineDesk provides a unified, glassmorphic, ultra-modern interface.

---

## ✨ Core Features

- **Multi-Tenant Workspaces**: Deep organizational structures with RBAC (Owner, Admin, Member, Billing).
- **AI Workflow Engine**: Visually build and execute generative AI workflows, backed by BullMQ & Redis.
- **Enterprise Security**: Rate-limiting (Upstash), 2FA/MFA support, magic links, session invalidation, and strict CSPs.
- **Billing & Subscriptions**: Stripe integrations with dynamic usage-based metering and tier enforcement.
- **Real-Time Analytics**: Built-in dashboards to track API usage, generations, compute cost, and user activity.
- **Cross-Platform**: Deploy to the web (Vercel/AWS) or bundle natively via Electron for macOS, Windows, and Linux.
- **Modern UI/UX**: Hand-crafted, responsive interface utilizing Tailwind CSS, Shadcn UI, framer-motion micro-animations, and custom edge-case empty states.

---

## 🛠️ Technology Stack

| Domain             | Technologies                                                                 |
| :----------------- | :--------------------------------------------------------------------------- |
| **Frontend**       | React 19, Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend**        | Next.js Server Actions, Next.js Edge Middleware, BullMQ (Workers)            |
| **Database**       | PostgreSQL, Prisma ORM                                                       |
| **Cache/Queue**    | Redis (Upstash)                                                              |
| **Authentication** | NextAuth.js, OTP (2FA)                                                       |
| **Desktop**        | Electron, Vite                                                               |
| **Testing**        | Playwright (E2E), Jest (Unit)                                                |
| **CI/CD**          | GitHub Actions                                                               |

---

## 🏁 Quick Start

### 1. Prerequisites

- Node.js `20.x` or higher
- Docker & Docker Compose (for local database & Redis)
- Stripe CLI (optional, for local webhook testing)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/devinedesk.git
cd devinedesk
npm ci
```

### 3. Environment Configuration

Copy the example environment file and fill in the required keys:

```bash
cp .env.example .env.local
```

Ensure the following critical variables are set:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A secure 32+ character random string.
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: For rate limiting.
- `REDIS_URL`: For BullMQ background workers.
- `STRIPE_SECRET_KEY`: For billing.

### 4. Spin up Infrastructure

Start the local PostgreSQL and Redis containers:

```bash
docker-compose up -d
```

### 5. Database Setup

Push the Prisma schema to your database and generate the client:

```bash
npx prisma db push
npx prisma generate
```

_(Optional) Seed the database with mock data:_

```bash
npm run seed
```

### 6. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

---

## 📚 Documentation Deep Dives

For exhaustive details on specific subsystems, please refer to the internal documentation:

1. [Architecture Overview](docs/ARCHITECTURE.md) - System topology, data flow, and deployment strategies.
2. [API Reference](docs/API_REFERENCE.md) - REST guidelines, error formats, and authentication.
3. [Database Schema](docs/DATABASE_SCHEMA.md) - Deep dive into models, relationships, and indexing.
4. [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Instructions for Vercel, AWS, and Docker.
5. [Developer Guide](docs/DEVELOPER_GUIDE.md) - Local setup, code guidelines, and testing.
6. [Security Guide](docs/SECURITY_GUIDE.md) - Security postures, rate limiting, and compliance standards.
7. [Runbooks](docs/RUNBOOKS.md) - Incident management and site reliability procedures.

---

## 🧪 Testing

We employ rigorous testing strategies before any code hits production.

**Unit Tests (Jest)**

```bash
npm run test
```

**End-to-End Tests (Playwright)**
_(Requires DB & Redis via Docker)_

```bash
npm run test:e2e
```

---

## 🤝 Contributing

We welcome contributions! Please follow the established PR workflows:

1. Create a feature branch (`feat/your-feature-name`).
2. Write unit tests for new logic.
3. Ensure `npm run lint` and `npx prisma validate` pass.
4. Submit a PR against the `develop` branch.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
