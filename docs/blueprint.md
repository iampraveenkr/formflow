# FormFlow Blueprint

## Completed modules

1. Repository scaffold
2. Authentication and workspace onboarding

## Authentication behavior

- Unauthenticated users are redirected to `/login` for protected routes.
- Authenticated users without completed onboarding are redirected to `/onboarding`.
- Authenticated and onboarded users are redirected to `/dashboard` from `/login`.
- Sessions are stored in HTTP-only signed cookies.

## Onboarding behavior

On first sign-in, FormFlow bootstraps:
- `users` profile
- `workspaces` record
- `workspace_members` owner membership

On onboarding submit, workspace details are saved and onboarding status is marked complete.

## Next modules

3. Google account connection management UI
4. Form sync and field mapping
5. Workflow CRUD
6. Condition engine
7. Action engine
8. Run logs and retries
9. Billing scaffold
