# API Documentation

## Overview
The DevineDesk API is a RESTful interface that allows developers to programmatically interact with the platform. It provides endpoints for managing workspaces, executing AI workflows, and retrieving analytics.

All endpoints are located under the `/api/v1/*` namespace.

---

## Authentication

All API requests require authentication. DevineDesk supports two primary methods:

1. **Session Cookies (Web)**: Automatically managed by NextAuth.js for users interacting via the browser.
2. **Bearer Tokens (API)**: For programmatic access, developers must provision an API Key from the dashboard and include it in the `Authorization` header.

```http
Authorization: Bearer dd_live_1234567890abcdef
```

---

## Standard Responses & Errors

We adhere strictly to the **RFC 7807 (Problem Details for HTTP APIs)** standard for error responses. 

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "wkf_123",
    "name": "Generate Summary"
  },
  "meta": {
    "pagination": {
      "total": 1,
      "page": 1
    }
  }
}
```

### Error Response (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "type": "https://devinedesk.com/docs/errors/rate-limit-exceeded",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "You have exceeded your organization's API quota.",
    "instance": "/api/v1/workflows/execute"
  }
}
```

---

## Rate Limiting

Rate limiting is enforced globally at the edge via Upstash Redis.
- **Free Tier**: 60 requests / minute
- **Pro Tier**: 600 requests / minute
- **Enterprise Tier**: Custom (default 6000 / minute)

Headers returned on every request:
- `X-RateLimit-Limit`: Maximum requests allowed in the time window.
- `X-RateLimit-Remaining`: Requests remaining in the current window.
- `X-RateLimit-Reset`: Unix timestamp when the limit resets.

---

## Pagination

Endpoints that return collections (e.g., listing Audit Logs or Workflow Runs) use cursor-based pagination for high performance on massive datasets.

**Query Parameters:**
- `limit`: Number of items to return (default: 50, max: 100).
- `cursor`: The ID of the last item in the previous page.

---

## Webhooks

DevineDesk can notify your external services when asynchronous events occur (e.g., a long-running workflow finishes).

1. Register an endpoint in the Dashboard (`Settings -> Webhooks`).
2. DevineDesk will send a `POST` request to your endpoint with the event payload.
3. **Security**: All webhooks contain an `X-DevineDesk-Signature` header. You must verify this HMAC SHA-256 signature using your Webhook Secret to guarantee the payload originated from DevineDesk.

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hash === signature;
}
```
