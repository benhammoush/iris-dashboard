import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { APP_DISPLAY_VERSION } from '../appVersion';
import { useTheme } from '../design-system';
import { looksLikeSolanaAddress } from '../data/solana';

function money(value, digits = 2) {
  return value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

function millions(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${(Number(value) / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
}

function Navbar({ market = null }) {
  const { assets } = useCatalog();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const queryValue = query.trim();
  const normalized = queryValue.toUpperCase();
  const assetMatches = queryValue ? assets.filter((asset) => asset.mint?.includes(queryValue) || [asset.symbol, asset.name].some((value) => value?.toUpperCase().includes(normalized))).slice(0, 5) : [];
  const publicAddress = looksLikeSolanaAddress(queryValue) ? queryValue : null;

  function go(path) {
    navigate(path);
    setQuery('');
  }

  return <>
    <header className="iris-header">
      <Link className="iris-brand" to="/"><span className="iris-brand-mark"><img src="/logoiris.png" alt="" /></span><span className="iris-brand-name">IRIS</span><span className="iris-version">{APP_DISPLAY_VERSION}</span></Link>
      <span className="iris-divider" />
      <nav className="iris-nav" aria-label="Main navigation"><NavLink to="/" end>Home</NavLink></nav>
      <div className="iris-search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets or paste a wallet address" aria-label="Search assets or paste a wallet address" />
        {query && <ul className="iris-results">
            {assetMatches.map((asset) => <li key={asset.mint || asset.symbol}><button onClick={() => go(`/asset/${encodeURIComponent(asset.mint || asset.symbol)}`)}>{asset.symbol} · {asset.priceUsd === null || asset.priceUsd === undefined ? 'Price unavailable' : `$${Number(asset.priceUsd).toFixed(5)}`}</button></li>)}
            {publicAddress && <li><button onClick={() => go(`/asset/${publicAddress}`)}>View asset {publicAddress}</button></li>}
            {publicAddress && <li><button onClick={() => go(`/wallet/${publicAddress}`)}>View public wallet {publicAddress}</button></li>}
            {!assetMatches.length && !publicAddress && <li><button disabled>No loaded matches.</button></li>}
        </ul>}
      </div>
       {market && <div className="iris-jupiter-market" aria-label={`${market.symbol} Jupiter market summary`}>
         <span className="iris-jupiter-market-brand">JUPITER</span>
         <div><small>{market.symbol} price</small><strong>{money(market.priceUsd, 5)}</strong>{market.change24hPct !== null && market.change24hPct !== undefined && <em className={Number(market.change24hPct) >= 0 ? 'iris-positive' : 'iris-negative'}>{Number(market.change24hPct) >= 0 ? '+' : ''}{Number(market.change24hPct).toFixed(2)}%</em>}</div>
         <div><small>Market cap</small><strong>{millions(market.marketCapUsd)}</strong></div>
         <div><small>24H volume</small><strong>{millions(market.activity?.volume24hUsd)}</strong></div>
         <div><small>Liquidity</small><strong>{millions(market.liquidityUsd)}</strong></div>
       </div>}
       <div className="iris-header-actions">
        <button className="iris-theme-button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">{mode === 'dark' ? 'LIGHT' : 'DARK'}</button>
      </div>
    </header>
    <nav className="iris-mobile-nav" aria-label="Mobile navigation"><NavLink to="/" end>Home</NavLink></nav>
  </>;
}

export default Navbar;
