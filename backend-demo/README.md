# Hono + Drizzle Backend Demo

This is a professional backend scaffold designed to replace Supabase using Node.js.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    cd backend-demo
    npm install
    ```

2.  **Configuration**:
    - Copy `.env.example` to `.env`.
    - Provide a valid `DATABASE_URL` (PostgreSQL).

3.  **Database Setup**:
    - Generate migrations: `npm run db:generate`
    - Apply migrations: `npm run db:migrate`
    - (Optional) Open Database Studio: `npm run db:studio`

4.  **Run Dev Server**:
    ```bash
    npm run dev
    ```

## Project Structure

- `src/index.ts`: The Hono API server.
- `src/db/`: Database configuration and schema.
- `drizzle.config.ts`: Migration settings.

## Why this is better than Supabase for some use cases:

1.  **Direct Control**: No middleware between you and the database.
2.  **Type Safety**: End-to-end TypeScript types.
3.  **Performance**: Extremely fast start-up times and query execution.
4.  **No Lock-in**: Take your code to any VPS or Cloud provider.
