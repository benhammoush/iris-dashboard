import { createContext, useContext } from 'react';
import { workerApi } from '../api/worker';
import { assetsFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';

const CatalogContext = createContext({ assets: [], loading: true });

export function CatalogProvider({ children }) {
  const assets = useWorkerResource(workerApi.assets, []);
  return (
    <CatalogContext.Provider value={{
      assets: assetsFrom(assets.data),
      loading: assets.loading, meta: assets.meta, error: assets.error,
    }}>
      {children}
    </CatalogContext.Provider>
  );
}

export const useCatalog = () => useContext(CatalogContext);
