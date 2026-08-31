import { useCallback, useEffect, useState } from "react";
import { ApiError, loadDashboard } from "../api/client";
import { applicationMessages } from "../i18n/application";
import { useI18n } from "../i18n/I18n";
import type { DashboardData } from "../types";

export function useDashboardData(onSessionExpired: () => void) {
  const { locale } = useI18n();
  const copy = applicationMessages[locale].state;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      setData(await loadDashboard());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setLoadError(
        error instanceof Error
          ? error.message
          : copy.dashboardLoadFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [copy.dashboardLoadFailed, onSessionExpired]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  return {
    data,
    loading,
    loadError,
    refreshDashboard,
    setData,
  };
}
