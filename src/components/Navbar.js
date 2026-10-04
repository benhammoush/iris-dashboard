import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { APP_DISPLAY_VERSION } from '../appVersion';
import { useTheme } from '../contexts/ThemeContext';

function Navbar({ fees = null }) {
  const { assets, wallets } = useCatalog();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const normalized = query.trim().toUpperCase();
  const assetMatches = normalized ? assets.filter((asset) => asset.symbol?.startsWith(normalized)).slice(0, 5) : [];
  const walletMatches = normalized ? wallets.filter((wallet) => (wallet.address || wallet).toUpperCase().startsWith(normalized)).slice(0, 3) : [];

  function go(path) {
    navigate(path);
    setQuery('');
  }

  return <>
    <header className="iris-header">
      <Link className="iris-brand" to="/"><span className="iris-brand-mark"><img src="/logoiris.png" alt="" /></span><span className="iris-brand-name">IRIS</span><span className="iris-version">{APP_DISPLAY_VERSION}</span></Link>
      <span className="iris-divider" />
      <nav className="iris-nav" aria-label="Main navigation"><NavLink to="/" end>Market</NavLink><NavLink to="/assets">Assets</NavLink><NavLink to="/wallets">Wallets</NavLink></nav>
      <div className="iris-search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets or tracked wallets" aria-label="Search assets or tracked wallets" />
        {query && <ul className="iris-results">
          {assetMatches.map((asset) => <li key={asset.symbol}><button onClick={() => go(`/asset/${asset.symbol}`)}>{asset.symbol} · ${Number(asset.price_usd || 0).toFixed(5)}</button></li>)}
          {walletMatches.map((wallet) => { const address = wallet.address || wallet; return <li key={address}><button onClick={() => go(`/wallet/${address}`)}>{wallet.label || address}</button></li>; })}
          {!assetMatches.length && !walletMatches.length && <li><button disabled>No loaded matches.</button></li>}
        </ul>}
      </div>
      <div className="iris-header-actions">
        {fees?.all?.medium_priority && <span className="iris-status">{(fees.all.medium_priority / 1000000).toFixed(2)} STX</span>}
        <span className="iris-live-dot" aria-label="Worker connected" title="Worker data available" />
        <button className="iris-theme-button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">{mode === 'dark' ? 'LIGHT' : 'DARK'}</button>
      </div>
    </header>
    <nav className="iris-mobile-nav" aria-label="Mobile navigation"><NavLink to="/" end>Market</NavLink><NavLink to="/assets">Assets</NavLink><NavLink to="/wallets">Wallets</NavLink></nav>
  </>;
}

export default Navbar;
