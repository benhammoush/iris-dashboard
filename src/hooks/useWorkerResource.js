import { useEffect, useState } from 'react';

export function useWorkerResource(load, dependencies = []) {
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: null, meta: null, error: null });
    load({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setState({ loading: false, data: result.data, meta: result.meta, error: result.error || null });
      }
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ loading: false, data: null, meta: null, error });
    });
    return () => controller.abort();
    // Callers define dependencies for their stable resource loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return state;
}
