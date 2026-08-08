# Contribution Guide

Thank you for your interest in contributing to DevineDesk! 

## Branching Strategy
We use a standard Git Flow branching model:
- `main`: Production-ready code.
- `develop`: Integration branch for upcoming features.
- `feat/*`: Feature branches (e.g., `feat/auth-update`).
- `fix/*`: Bug fix branches (e.g., `fix/redis-timeout`).

## Development Workflow
1. Fork the repository and clone locally.
2. Checkout a new branch from `develop`.
3. Make your changes.
4. Run the code quality suite:
   ```bash
   npm run lint
   npm run format
   npm run test
   ```
5. Commit your changes using Conventional Commits format (e.g., `feat(ui): add new dark mode toggle`).
6. Push to your fork and open a Pull Request against the `develop` branch.

## Pull Request Requirements
- **Tests:** Any new backend logic or complex frontend state must be accompanied by a Vitest unit test.
- **Documentation:** If you add an API endpoint, it must be documented via Zod OpenAPI registry in `src/lib/openapi-registry.js`.
- **Review:** All PRs require at least 1 approval from a core maintainer before merging.

## Code Style
- We use ESLint and Prettier. Run `npm run format` before committing.
- Use `lucide-react` for icons.
- Use Tailwind CSS for styling. Avoid writing custom CSS classes in globals.css unless absolutely necessary.
