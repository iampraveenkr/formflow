# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- ESLint + Prettier
- Supabase integration wrapper

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - lint checks
- `npm run typecheck` - TypeScript checks
- `npm run test` - test suite

## Scaffolded routes

- `/login`
- `/onboarding`
- `/dashboard`
- `/workflows`
- `/workflows/[id]`
- `/integrations`
- `/settings`
- `/billing`
- `/logs`

## Key folders

- `app/`
- `components/`
- `lib/`
- `services/`
- `types/`
- `db/`
- `tests/`
- `public/`
- `docs/`
