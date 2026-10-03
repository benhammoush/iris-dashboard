import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Wallet from './components/Wallet';
import Asset from './components/Asset';
import NoMatch from './components/NoMatch';
import { CatalogProvider } from './contexts/CatalogContext';
import { apiConfigurationError } from './api/client';
function App() {
  const location = useLocation(); // utilisez useLocation pour obtenir l'URL actuelle

  if (apiConfigurationError) {
    return <main className="flex min-h-screen items-center justify-center p-6 text-center" role="alert"><div><h1 className="text-xl font-semibold">CONFIGURATION_ERROR</h1><p className="mt-2">{apiConfigurationError}</p></div></main>;
  }

  return (
    <CatalogProvider><div className="scroll-smooth">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          key={location.pathname}
          path="/wallet/:address"
          element={<Wallet />}
        />
        <Route
          key={location.pathname}
          path="/asset/:symbol"
          element={<Asset />}
        />
        <Route path="*" element={<NoMatch />}>
          {' '}
        </Route>
      </Routes>
    </div></CatalogProvider>
  );
}
export default App;
