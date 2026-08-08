# Devinedesk API Reference

## Base URL
All API routes are hosted under `/api`. We are transitioning to a `/api/v1/` standard.

## Authentication
Every authenticated endpoint strictly requires a valid session token. 
Endpoints exposed to external developers require an API Key passed in the `Authorization` header:
`Authorization: Bearer sk_test_...`

## Core Endpoints

### `POST /api/v1/generate`
Queues a new AI Generation job.
**Payload:**
```json
{
  "type": "t2i",
  "prompt": "A futuristic city",
  "model": "stable-diffusion-xl"
}
```
**Response (202 Accepted):**
```json
{
  "jobId": "gen_123456",
  "status": "queued"
}
```

### `GET /api/v1/runs/:id`
Polls for the status of a generation job or workflow execution.

### `POST /api/webhooks/stripe`
Handles asynchronous billing events from Stripe (subscription creation, payment success, refunds). Uses raw body signature verification.

## Error Handling
All routes return standard JSON error structures enforced by the global `withApiAuth` handler:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API Key provided."
}
```

Standard HTTP Status Codes:
- `400 Bad Request`: Zod schema validation failed.
- `401 Unauthorized`: Missing or invalid token/API key.
- `403 Forbidden`: Lacking sufficient OrgRole or WorkspaceRole.
- `429 Too Many Requests`: Upstash Redis rate limit hit.
- `500 Internal Server Error`: Uncaught exceptions.
