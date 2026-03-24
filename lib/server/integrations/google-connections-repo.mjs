const accounts = new Map();

function nowIso() {
  return new Date().toISOString();
}

export async function upsertGoogleAccount(account) {
  accounts.set(account.id, account);
  return account;
}

export async function listGoogleAccountsByWorkspace(workspaceId) {
  return Array.from(accounts.values()).filter((account) => account.workspaceId === workspaceId);
}

export async function findGoogleAccountById(id) {
  return accounts.get(id) ?? null;
}

export async function setGoogleAccountStatus(id, status) {
  const account = accounts.get(id);
  if (!account) {
    return;
  }
  account.status = status;
  account.updatedAt = nowIso();
  accounts.set(id, account);
}

export async function updateGoogleAccountSync(id, input) {
  const account = accounts.get(id);
  if (!account) {
    return;
  }
  account.lastSyncAt = input.at;
  account.lastSyncStatus = input.status;
  account.updatedAt = nowIso();
  accounts.set(id, account);
}

export async function removeGoogleAccount(id) {
  accounts.delete(id);
}

export function clearGoogleAccountStore() {
  accounts.clear();
}
