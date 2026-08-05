# API Documentation

## `GET /api/settings`
Retrieves all configured settings for the user.
- **Headers**: `x-user-id` (Required)
- **Response**: `{ [key: string]: value }`

## `POST /api/settings`
Saves or updates application settings (e.g., API keys).
- **Headers**: `x-user-id` (Required)
- **Body**: JSON object of Key-Value pairs.
- **Response**: `{ success: true }`

## `GET /api/history`
Retrieves generated history items.
- **Headers**: `x-user-id` (Required)
- **Response**: Array of Generation objects.

## `POST /api/state`
Syncs raw application UI states (e.g., inputs, textareas) dynamically to the database.
- **Headers**: `x-user-id` (Required)
- **Body**: `{ key: "PERSIST_KEY", value: "{...JSON...}" }`
- **Response**: `{ success: true }`

## `POST /api/generate`
Unified generation proxy.
- **Headers**: `x-user-id` (Required)
- **Body**: Configuration containing `provider`, `prompt`, etc.
- **Response**: Streamed result or final image/video URLs.
