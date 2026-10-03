import '../App.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';

function Navbar({ fees }) {
  const { assets, wallets } = useCatalog();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const normalized = query.trim().toUpperCase();
  const assetMatches = normalized ? assets.filter((asset) => asset.symbol?.startsWith(normalized)).slice(0, 5) : [];
  const walletMatches = normalized ? wallets.filter((wallet) => (wallet.address || wallet).toUpperCase().startsWith(normalized)).slice(0, 3) : [];

  function toggleDarkMode() {
    const dark = localStorage.theme !== 'dark';
    localStorage.theme = dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', dark);
  }

  return <nav className="navbar">
    <div className="navbar-start"><Link to="/"><img src="/logoiris.png" className="h-20" alt="Iris Logo" /></Link></div>
    <div className="navbar-center w-full max-w-md"><div className="relative w-full">
      <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-[30px] border border-slate-300 bg-secondary_light px-4 py-3 text-sm dark:border-neutral-700 dark:bg-secondary_dark" placeholder="Search assets or tracked wallets" />
      {query && <ul className="absolute z-10 w-full rounded-b-xl border bg-secondary_light p-2 shadow dark:bg-secondary_dark">
        {assetMatches.map((asset) => <li key={asset.symbol}><button className="w-full px-2 py-1 text-left" onClick={() => { navigate(`/asset/${asset.symbol}`); setQuery(''); }}>{asset.symbol} - {Number(asset.price_usd || 0).toFixed(5)} $</button></li>)}
        {walletMatches.map((wallet) => { const address = wallet.address || wallet; return <li key={address}><button className="w-full px-2 py-1 text-left" onClick={() => { navigate(`/wallet/${address}`); setQuery(''); }}>{wallet.label || address}</button></li>; })}
        {!assetMatches.length && !walletMatches.length && <li className="px-2 py-1 text-sm text-gray-500">No loaded asset or tracked wallet matches.</li>}
      </ul>}
    </div></div>
    <div className="navbar-end gap-2">
      {fees?.all?.medium_priority && <span className="text-sm">{(fees.all.medium_priority / 1000000).toFixed(2)} STX</span>}
      <button className="btn btn-circle btn-ghost" onClick={toggleDarkMode} aria-label="Toggle dark mode">?</button>
    </div>
  </nav>;
}

export default Navbar;
