# Deployment Guide

DevineDesk is fully responsive and supports both web deployment and local packaging.

## Web Deployment (Vercel/AWS)
1. Set the `DATABASE_URL` in your `.env` to a production PostgreSQL/MySQL connection string.
2. Run `npx prisma generate` and `npx prisma migrate deploy` in your CI/CD pipeline.
3. Build the application using `npm run build` and run `npm run start`.
4. Ensure environment variables are loaded correctly for inference providers.

## Desktop Build (Electron)
The desktop application is built with Vite and packaged with Electron-builder. It natively leverages SQLite.

1. macOS: `npm run electron:build`
2. Windows: `npm run electron:build:win`
3. Linux: `npm run electron:build:linux`

Installers will be populated into the `release/` directory.
