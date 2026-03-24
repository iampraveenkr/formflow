"use client";

import { useEffect, useMemo, useState } from "react";

interface ConnectedAccount {
  id: string;
  googleEmail: string;
  tokenExpiry: string;
  scopes: string[];
  status: "active" | "expired" | "revoked";
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "error" | null;
}

export default function IntegrationsPage(): JSX.Element {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingId, setIsRefreshingId] = useState<string | null>(null);
  const [isDisconnectingId, setIsDisconnectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryMessage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      return "Google account connected successfully.";
    }
    if (params.get("error")) {
      return `Google connection error: ${params.get("error")}`;
    }
    return null;
  }, []);

  async function loadAccounts(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await fetch("/api/integrations/google/accounts");
    if (!response.ok) {
      setErrorMessage("Unable to load connected accounts.");
      setIsLoading(false);
      return;
    }

    const body = (await response.json()) as { accounts: ConnectedAccount[] };
    setAccounts(body.accounts);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function handleDisconnect(accountId: string): Promise<void> {
    setIsDisconnectingId(accountId);
    setErrorMessage(null);

    const response = await fetch("/api/integrations/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId })
    });

    setIsDisconnectingId(null);

    if (!response.ok) {
      setErrorMessage("Disconnect failed.");
      return;
    }

    await loadAccounts();
  }

  async function handleRefresh(accountId: string): Promise<void> {
    setIsRefreshingId(accountId);
    setErrorMessage(null);

    const response = await fetch("/api/integrations/google/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId })
    });

    setIsRefreshingId(null);

    if (!response.ok) {
      setErrorMessage("Refresh failed.");
      return;
    }

    await loadAccounts();
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="mt-1 text-sm text-slate-600">Connect one or more Google accounts for workflow actions.</p>
        </div>
        <a href="/api/integrations/google/start" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Connect Google account
        </a>
      </div>

      {queryMessage ? <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">{queryMessage}</p> : null}
      {errorMessage ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading connected accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-slate-600">No Google accounts connected yet.</p>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => (
            <li key={account.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{account.googleEmail}</p>
                  <p className="text-xs text-slate-500">Scopes: {account.scopes.join(", ")}</p>
                  <p className="text-xs text-slate-500">Last sync: {account.lastSyncAt ?? "Not yet"}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    account.status === "active"
                      ? "bg-green-100 text-green-700"
                      : account.status === "expired"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {account.status}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => void handleRefresh(account.id)}
                  disabled={isRefreshingId === account.id}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60"
                >
                  {isRefreshingId === account.id ? "Refreshing..." : "Refresh token"}
                </button>
                <button
                  onClick={() => void handleDisconnect(account.id)}
                  disabled={isDisconnectingId === account.id}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60"
                >
                  {isDisconnectingId === account.id ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
