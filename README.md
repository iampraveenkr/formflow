# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app scaffold.

## Current scaffold scope

This module provides a repository and route scaffold with placeholder UI shells and typed structure. Business logic modules are not implemented yet.

## Local setup

1. Create env file:
   ```bash
   cp .env.example .env.local
   ```
2. Run build validation:
   ```bash
   npm run build
   ```
3. Run tests:
   ```bash
   npm run test
   ```

## Scripts

- `npm run dev` - scaffold placeholder command
- `npm run build` - TypeScript build validation (`tsc --noEmit`)
- `npm run lint` - TypeScript-based lint gate for this scaffold module
- `npm run typecheck` - strict TypeScript check
- `npm run test` - node test runner for scaffold checks

## Routes scaffolded

- `/login`
- `/onboarding`
- `/dashboard`
- `/workflows`
- `/workflows/[id]`
- `/integrations`
- `/settings`
- `/billing`
- `/logs`

## File tree

```text
app/
  (public)/
    layout.tsx
    login/page.tsx
    onboarding/page.tsx
  (app)/
    layout.tsx
    dashboard/page.tsx
    workflows/page.tsx
    workflows/[id]/page.tsx
    integrations/page.tsx
    settings/page.tsx
    billing/page.tsx
    logs/page.tsx
  api/health/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  layouts/
  navigation/
lib/
services/
types/
db/
tests/
public/
docs/
```
