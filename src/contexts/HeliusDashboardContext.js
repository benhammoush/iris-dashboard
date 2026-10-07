import { createContext, useContext } from 'react';
import { workerApi } from '../api/worker';
import { networkFrom, recentTransactionsFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';

const HeliusDashboardContext = createContext({ network: null, transactions: [], loading: true, error: null, meta: null });

export function HeliusDashboardProvider({ children }) {
  const dashboard = useWorkerResource(workerApi.recentTransactions, [], 60_000);
  return <HeliusDashboardContext.Provider value={{ network: networkFrom(dashboard.data?.network), transactions: recentTransactionsFrom(dashboard.data), loading: dashboard.loading, error: dashboard.error, meta: dashboard.meta }}>{children}</HeliusDashboardContext.Provider>;
}

export const useHeliusDashboard = () => useContext(HeliusDashboardContext);
