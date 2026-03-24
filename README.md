# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Implemented module status

This repository now includes:
- Google OAuth route flow scaffold
- Session persistence with HTTP-only signed cookies
- Protected route middleware
- Workspace onboarding flow and redirect logic
- User/workspace bootstrap logic for first login
- Database migration for users/workspaces/workspace_members

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Set all required Google OAuth and session variables.
4. Start the app:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Auth and onboarding routes

- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/auth/signout`
- `POST /api/onboarding`

## Protected application routes

- `/dashboard`
- `/workflows`
- `/integrations`
- `/logs`
- `/billing`
- `/settings`

## Core folders

- `app/`
- `components/`
- `lib/`
- `services/`
- `types/`
- `db/`
- `tests/`
- `public/`
- `docs/`
