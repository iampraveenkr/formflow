# FormFlow Blueprint

## Completed modules

1. Repository scaffold
2. Authentication and workspace onboarding
3. Google account connection management

## Google connection module behavior

- Workspace members can connect multiple Google accounts.
- OAuth callbacks validate state and active session workspace.
- Access and refresh tokens are encrypted before storage.
- Account status transitions: `active`, `expired`, `revoked`.
- Disconnect and refresh operations are scoped to workspace context.
- Integration UI shows scopes, status, last sync time, and sync result.

## Next modules

4. Form sync and field mapping
5. Workflow CRUD
6. Condition engine
7. Action engine
8. Run logs and retries
9. Billing scaffold
