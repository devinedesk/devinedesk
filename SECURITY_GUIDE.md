# Security Architecture Guide

DevineDesk implements comprehensive enterprise-grade security protocols across all application layers.

## 1. Rate Limiting (DDoS & Abuse Protection)

We utilize `ioredis` to construct a robust Token Bucket rate limiter (`src/lib/rateLimit.js`).

- ALL `POST`, `PUT`, `DELETE` mutations on the `/api/*` router are aggressively rate-limited.
- Webhook endpoints are rate-limited to prevent external overflow.

## 2. Input Validation (XSS / NoSQL Injection Prevention)

- **Zod Validation**: No raw user input ever hits the Prisma query engine. Every endpoint strictly parses bodies through `/lib/validators.js`.
- If a payload fails Zod parsing, it is instantly rejected with a `400 Bad Request`, mitigating payload manipulation.

## 3. RBAC & Identity (Broken Access Control Prevention)

- Session management is handled securely via **NextAuth.js**.
- Organization and Workspace mutations enforce strict ownership checks before permitting edits.
- The `/api/admin/*` tree enforces a secondary database role-check for `SUPER_ADMIN`.

## 4. API Keys & Webhooks

- External AI endpoints are masked by the backend. Raw API keys (Stripe, AI providers) are NEVER shipped to the Next.js client bundle.
- Outbound Webhooks enforce strict HTTPS schema validation to prevent internal SSRF attacks.
