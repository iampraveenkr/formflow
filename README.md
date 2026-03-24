# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Implemented modules

- Repository scaffold
- Authentication and workspace onboarding
- Google account connection management
- Full Supabase/Postgres schema migrations + seed data

## Database deliverables

- Full schema migration: `supabase/migrations/202603241100_full_schema.sql`
- Single-file schema bootstrap: `supabase/formflow_schema.sql`
- Seed file: `supabase/seed.sql`
- Schema documentation: `docs/database-schema.md`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Configure Google OAuth and encryption/session secrets.
4. Start the app:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Connection API routes

- `GET /api/integrations/google/start`
- `GET /api/integrations/google/callback`
- `GET /api/integrations/google/accounts`
- `POST /api/integrations/google/disconnect`
- `POST /api/integrations/google/refresh`
