# Super Admin & Moderation Guide

The DevineDesk platform includes a deeply integrated Super Admin console at `/admin/super`.

## Accessing the Admin Console

Only users with the exact `SUPER_ADMIN` role defined in the Prisma PostgreSQL database can access the `/admin/*` routes.

- **RBAC**: Role-Based Access Control completely locks out standard `USER` tokens.
- **Verification**: Zod payload validations strictly drop any unauthorized mutations.

## Core Capabilities

1. **Analytics Oversight**: View live platform usage metrics and token burn rates via the Recharts visualizer.
2. **User Moderation**:
   - Search the entire user index.
   - Adjust token balances for refunds/promotions.
   - Instantly **suspend** or **ban** users by modifying their active database state.
3. **Audit Logs**: Review comprehensive platform-wide modifications and access traces.

## Security Considerations

Because the `/api/admin/*` endpoints bypass standard consumption limits, they are highly sensitive. Never share SUPER_ADMIN credentials, and monitor the Audit Logs closely for anomalous internal behavior.
