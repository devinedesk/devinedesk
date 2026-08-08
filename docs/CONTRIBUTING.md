# Contributing to DevineDesk

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/devinedesk/devinedesk.git
   cd devinedesk
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the local dev server**
   ```bash
   npm run dev
   ```

## Pull Request Process
1. Ensure your code follows the established formatting (`npm run format`).
2. Update the README.md with details of changes to the interface.
3. You may merge the Pull Request in once you have the sign-off of at least one other developer.
