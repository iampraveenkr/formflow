import { setGoogleAccountStatus, updateGoogleAccountSync } from "./google-connections-repo.mjs";

export async function applyRefreshFailureStatus(accountId) {
  await setGoogleAccountStatus(accountId, "revoked");
  await updateGoogleAccountSync(accountId, { status: "error", at: new Date().toISOString() });
}
