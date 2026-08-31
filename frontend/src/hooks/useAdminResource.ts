import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { ApiError } from "../api/client";

interface AdminResourceState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refreshing: boolean;
}

export function useAdminResource<T>(
  loader: () => Promise<T>,
  dependencies: DependencyList,
  onSessionExpired: () => void,
  onForbidden: () => void,
) {
  const requestId = useRef(0);
  const [state, setState] = useState<AdminResourceState<T>>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
  });

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState((current) => ({
      ...current,
      error: null,
      loading: current.data === null,
      refreshing: current.data !== null,
    }));
    try {
      const data = await loader();
      if (requestId.current !== currentRequest) return;
      setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      if (error instanceof ApiError && error.status === 403) onForbidden();
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error : new Error("Le chargement a échoué."),
        loading: false,
        refreshing: false,
      }));
    }
  }, [loader, onForbidden, onSessionExpired]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
    // The caller owns the stable resource inputs that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { ...state, reload: load };
}
