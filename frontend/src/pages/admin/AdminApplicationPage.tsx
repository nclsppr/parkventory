import { useEffect, useState } from "react";
import type { NoticeTone } from "../../components/AppShell";
import { AdminShell, type AdminRoute } from "../../components/admin/AdminShell";
import { Toast } from "../../components/Toast";
import type { SessionData } from "../../types";
import { AdminOperationsPage } from "./AdminOperationsPage";
import { AdminOverviewPage } from "./AdminOverviewPage";
import { AdminTenantPage } from "./AdminTenantPage";
import { AdminTenantsPage } from "./AdminTenantsPage";
import { AdminUsersPage } from "./AdminUsersPage";
import "./admin.css";

export interface AdminApplicationPageProps {
  route: AdminRoute;
  search: string;
  session: SessionData;
  tenantId?: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}

export default function AdminApplicationPage({
  route,
  search,
  session,
  tenantId,
  onSessionExpired,
  onForbidden,
}: AdminApplicationPageProps) {
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const notify = (message: string, tone: NoticeTone = "success") => setNotice({ message, tone });

  useEffect(() => {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#admin-content h1")?.focus({ preventScroll: true });
    });
  }, [route, tenantId]);

  return (
    <>
      <AdminShell
        route={route}
        session={session}
        loading={false}
        loadError={null}
        onRetry={() => undefined}
        onNotify={notify}
        onSessionExpired={onSessionExpired}
      >
        {route === "overview" ? (
          <AdminOverviewPage onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        ) : route === "tenants" ? (
          <AdminTenantsPage search={search} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        ) : route === "tenant" && tenantId ? (
          <AdminTenantPage tenantId={tenantId} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        ) : route === "users" ? (
          <AdminUsersPage search={search} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        ) : (
          <AdminOperationsPage search={search} onSessionExpired={onSessionExpired} onForbidden={onForbidden} />
        )}
      </AdminShell>
      <Toast message={notice?.message ?? null} tone={notice?.tone} onDismiss={() => setNotice(null)} />
    </>
  );
}
