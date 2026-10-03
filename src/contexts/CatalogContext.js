import { createContext, useContext } from 'react';
import { workerApi } from '../api/worker';
import { assetsFrom, walletsFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';

const CatalogContext = createContext({ assets: [], wallets: [], loading: true });

export function CatalogProvider({ children }) {
  const assets = useWorkerResource(workerApi.assets, []);
  const wallets = useWorkerResource(workerApi.wallets, []);
  return (
    <CatalogContext.Provider value={{
      assets: assetsFrom(assets.data), wallets: walletsFrom(wallets.data),
      loading: assets.loading || wallets.loading, meta: assets.meta, error: assets.error || wallets.error,
    }}>
      {children}
    </CatalogContext.Provider>
  );
}

export const useCatalog = () => useContext(CatalogContext);
