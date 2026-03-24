# FormFlow

FormFlow is a Google Workspace-integrated workflow automation app that turns Google Form submissions into business actions.

## Milestone status

Current milestone: **1 — repository scaffold**.

The architecture and milestone plan are documented in [`docs/blueprint.md`](docs/blueprint.md).

## Local development

```bash
npm install
npm run dev
```

Health check endpoint:

```bash
curl http://localhost:3000/api/health
```

## Safe defaults documented

- Unknown product details are intentionally defaulted to conservative behavior (for example, workflows default to `draft`) until requirements are finalized.
- All domain models are strongly typed and maintained in `src/types`.

