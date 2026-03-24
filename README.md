# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Implemented modules

- Repository scaffold
- Authentication and workspace onboarding
- Google account connection management
- Google Form sync and field mapping
- Full Supabase/Postgres schema migrations + seed data

## Database deliverables

- Full schema migration: `supabase/migrations/202603241100_full_schema.sql`
- Single-file schema bootstrap: `supabase/formflow_schema.sql`
- Form sync migration: `supabase/migrations/202603241200_form_sync_and_mapping.sql`
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

## Form sync API routes

- `GET /api/forms/google`
- `POST /api/forms/sync`
- `GET /api/forms/workflow`
- `POST /api/forms/map`
- `POST /api/forms/preview`
