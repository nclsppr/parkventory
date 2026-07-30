import { useCallback, useEffect, useState } from "react";
import { ApiError, loadDashboard } from "../api/client";
import { isPublicDemo } from "../config";
import { demoDashboard } from "../data/demo";
import type { DashboardData } from "../types";

export function useDashboardData(onSessionExpired: () => void) {
  const [data, setData] = useState<DashboardData | null>(
    isPublicDemo ? structuredClone(demoDashboard) : null,
  );
  const [loading, setLoading] = useState(!isPublicDemo);
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
          : "Les données du parking n’ont pas pu être chargées.",
      );
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    if (!isPublicDemo) void refreshDashboard();
  }, [refreshDashboard]);

  return {
    data,
    loading,
    loadError,
    refreshDashboard,
    setData,
  };
}
