# Deployment Steps (Draft)

1. Set environment variables (see README env section).
2. Run migrations against production DB.
3. Deploy Next.js app.
4. Verify `/api/health` and `/api/admin/health`.
5. Run smoke test flows:
   - onboarding
   - Google connect/disconnect
   - workflow run + logs + retry
   - billing plan gate checks
6. Confirm error tracking and analytics ingestion.
