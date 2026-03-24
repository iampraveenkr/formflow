# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Implemented modules

- Repository scaffold
- Authentication and workspace onboarding
- Google account connection management

## Google account connection capabilities

- Connect one or more Google accounts from `/integrations`
- OAuth consent flow with state validation
- Encrypted token storage (access + refresh)
- Connection status management (`active`, `expired`, `revoked`)
- Account listing, refresh, and disconnect actions
- Scope visibility, last sync time, and sync status in UI
- Mock mode support (`GOOGLE_MOCK_MODE=true`) for local development

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
