# Database Documentation

DevineDesk uses **Prisma** with a **SQLite** database (`dev.db`).

## Schema Design

### User
Represents a local or authenticated session.
- `id`: String (UUID or device ID)
- `name`: String
- `createdAt`: DateTime

### Setting
Stores flexible Key-Value pairs for configuration and UI state.
- `key`: String (e.g., 'openrouter_key', 'hg_video_studio_state')
- `value`: String
- `userId`: String (Foreign Key)

### Generation
Centralized history of all AI outputs.
- `id`: String (UUID)
- `userId`: String
- `prompt`: String
- `model`: String
- `resultUrl`: String
- `status`: String

## Migrations
Run `npx prisma migrate dev` to synchronize schema changes. Do not modify the database directly.
