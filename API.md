# API Documentation

## `GET /api/settings`

Retrieves all configured settings for the user.

- **Headers**: `Cookie` (NextAuth Session)
- **Response**: `{ [key: string]: value }`

## `POST /api/settings`

Saves or updates application settings (e.g., UI preferences).

- **Headers**: `Cookie` (NextAuth Session)
- **Body**: JSON object of Key-Value pairs.
- **Response**: `{ success: true }`

## `GET /api/history`

Retrieves generated history items.

- **Headers**: `Cookie` (NextAuth Session)
- **Response**: Array of Generation objects.

## `POST /api/state`

Syncs raw application UI states dynamically to the database.

- **Headers**: `Cookie` (NextAuth Session)
- **Body**: `{ key: "PERSIST_KEY", value: "{...JSON...}" }`
- **Response**: `{ success: true }`

## `POST /api/generate`

Unified generation proxy. Deducts user credits and securely calls the internal backend (`localhost:8000`).

- **Headers**: `Cookie` (NextAuth Session)
- **Body**: Configuration containing `provider`, `prompt`, etc.
- **Response**: Streamed result or final media URLs.

## `POST /api/upload`

Uploads files directly into the platform's unified `Asset` database model.

- **Headers**: `Cookie` (NextAuth Session), `Content-Type: multipart/form-data`
- **Response**: `{ url: "...", type: "..." }`

## `POST /api/billing/checkout`

Initiates a Stripe Checkout session.

- **Headers**: `Cookie` (NextAuth Session)
- **Body**: `{ priceId: "..." }`
- **Response**: `{ url: "stripe_checkout_url" }`

## `POST /api/billing/webhook`

Handles asynchronous Stripe webhooks (e.g., successful payments) and credits the user's account via Prisma.

- **Headers**: `Stripe-Signature`
- **Response**: `{ received: true }`

## `GET|POST /api/workflow/[[...path]]`

Handles all node-based workflow operations (execution, saving, running).

- **Headers**: `Cookie` (NextAuth Session)
- **Response**: Node outputs or serialized workflow data.

## `GET|POST /api/agents/[[...path]]`

Manages AI agents, conversations, and async polling logic.

- **Headers**: `Cookie` (NextAuth Session)
- **Response**: Agent metadata or conversation history.
