import { useEffect, useState } from 'react';

export function useWorkerResource(load, dependencies = [], pollIntervalMs = 0) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ loading: true, refreshing: false, data: null, meta: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: current.data === null, refreshing: current.data !== null, error: null }));
    load({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setState({ loading: false, refreshing: false, data: result.data, meta: result.meta, error: result.error || null });
      }
    }).catch((error) => {
      if (!controller.signal.aborted) setState((current) => ({ ...current, loading: false, refreshing: false, error }));
    });
    return () => controller.abort();
    // Callers define dependencies for their stable resource loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, reload]);

  useEffect(() => {
    if (!pollIntervalMs) return undefined;
    let interval = null;
    const startPolling = () => {
      if (!document.hidden && interval === null) interval = setInterval(() => setReload((value) => value + 1), pollIntervalMs);
    };
    const stopPolling = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else {
        startPolling();
        setReload((value) => value + 1);
      }
    };
    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pollIntervalMs]);

  return { ...state, refetch: () => setReload((value) => value + 1) };
}
