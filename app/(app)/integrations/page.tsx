"use client";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const queryMessage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") return { tone: "success" as const, message: "Google account connected successfully." };
    if (params.get("error")) return { tone: "error" as const, message: `Google connection error: ${params.get("error")}` };
    return null;
  }, []);

  async function loadAccounts(): Promise<void> {
    setIsLoading(true);
    const response = await fetch("/api/integrations/google/accounts");
    if (!response.ok) {
      setBanner({ tone: "error", message: "Unable to load connected accounts." });
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
    const response = await fetch("/api/integrations/google/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId }) });
    setIsDisconnectingId(null);
    if (!response.ok) return setBanner({ tone: "error", message: "Disconnect failed." });
    setBanner({ tone: "success", message: "Account disconnected." });
    await loadAccounts();
  }

  async function handleRefresh(accountId: string): Promise<void> {
    setIsRefreshingId(accountId);
    const response = await fetch("/api/integrations/google/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId }) });
    setIsRefreshingId(null);
    if (!response.ok) return setBanner({ tone: "error", message: "Refresh failed." });
    setBanner({ tone: "success", message: "Token refreshed." });
    await loadAccounts();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="mt-1 text-sm text-slate-600">Connect and manage Google services used by workflow actions.</p>
        </div>
        <a href="/api/integrations/google/start"><Button>Connect Google account</Button></a>
      </div>

      {queryMessage ? <Banner tone={queryMessage.tone} message={queryMessage.message} /> : null}
      {banner ? <Banner tone={banner.tone} message={banner.message} /> : null}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : accounts.length === 0 ? (
        <EmptyState title="No connected accounts" description="Connect Google to enable email, docs, sheets, and calendar actions." action={<a href="/api/integrations/google/start"><Button>Connect now</Button></a>} />
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => (
            <li key={account.id}><Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{account.googleEmail}</p>
                  <p className="text-xs text-slate-500">Connected services: Gmail, Calendar, Docs, Sheets</p>
                  <p className="text-xs text-slate-500">Scopes: {account.scopes.join(", ")}</p>
                </div>
                <Badge label={account.status} tone={account.status === "active" ? "success" : account.status === "expired" ? "warning" : "danger"} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Last sync: {account.lastSyncAt ?? "Not yet"}</div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => void handleRefresh(account.id)} disabled={isRefreshingId === account.id}>{isRefreshingId === account.id ? "Refreshing..." : "Reconnect / Refresh"}</Button>
                <Button variant="danger" onClick={() => void handleDisconnect(account.id)} disabled={isDisconnectingId === account.id}>{isDisconnectingId === account.id ? "Disconnecting..." : "Disconnect"}</Button>
              </div>
            </Card></li>
          ))}
        </ul>
      )}
    </section>
  );
}
