# DevineDesk Admin Guide

## Overview
This guide provides platform administrators, super-admins, and security personnel with the necessary procedures for managing the DevineDesk platform via the unified Admin Command Center.

## Accessing the Admin Console
1. Log in to the application.
2. Navigate to `/admin`.
   - *Note: Only users with the `ADMIN` or `SUPER_ADMIN` role will be permitted to access this path. Other users will be redirected.*

## Admin Capabilities

### 1. Security Command Center (`/admin/security`)
- **Active Threats:** Monitors high-traffic anomalies, rate limit breaches, and suspicious IP addresses.
- **Failed Logins:** Displays 24-hour authentication failure metrics.
- **Global Audit Log:** A real-time, read-only ledger of every critical action taken across the platform (e.g., role changes, API key issuance, billing changes).

### 2. User & Organization Management
- **Role Assignments:** Upgrade users to Developer or Admin status.
- **Account Suspensions:** Temporarily disable accounts violating TOS. 
- **Workspace Audits:** View member counts and usage within specific multi-tenant organizations.

### 3. Operations & System Health (`/admin/operations` & `/admin/health`)
- **Active Workers:** View live BullMQ worker counts handling Generative AI requests.
- **Database Size:** Monitor live PostgreSQL database size.
- **Pending Jobs:** Track the background queue depth. If this exceeds 500+, consider spinning up additional worker nodes.

### 4. Finance & Billing (`/admin/finance`)
- Monitor global MRR (Monthly Recurring Revenue).
- View platform-wide credit consumption vs. credit purchases.

## Best Practices
- **Audit Logs:** Never attempt to manually edit the `AuditLog` table. It is append-only by design.
- **Roles:** Keep `SUPER_ADMIN` access limited to fewer than 3 individuals globally.
