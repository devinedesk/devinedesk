# Devinedesk Security Guide

## Global Security Architecture
Devinedesk adheres strictly to OWASP Top 10 prevention mechanisms. 
All data access MUST route through the centralized `withApiAuth` validation handler in `src/lib/apiHandler.js`.

## Data Isolation (Multitenancy)
The platform operates on a strict multitenant architecture.
Data is segregated logically via `organizationId` and `workspaceId` foreign keys in PostgreSQL. 
Every backend query MUST filter strictly by the `userId` or validated `workspaceId` extracted securely from the JWT session. NEVER rely on client-side ID assertions.

## Rate Limiting & Abuse Prevention
We use Upstash Redis to enforce strict sliding-window rate limits across the entire API surface.
- Free Tier users: 10 requests / 10s.
- Pro users: 50 requests / 10s.
If rate limits are breached, an HTTP 429 is automatically returned, preventing volumetric DDoS or brute-force attacks on AI endpoints.

## Authentication
Sessions are managed via secure, HttpOnly, SameSite cookies. Passwords are hashed heavily using `bcryptjs` with a salt rounds setting of 10. 

## Auditing
Critical mutations (Workspace deletions, Member invitations, API Key generation) are strictly recorded to the `AuditLog` table. This allows Organization Owners to track any malicious inside actors.
