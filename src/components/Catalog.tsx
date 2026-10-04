import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCatalog } from '../contexts/CatalogContext'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { looksLikeSolanaAddress } from '../data/solana'

export default function Catalog({ kind }: { kind: 'assets' | 'wallets' }) {
  const { assets, loading, error } = useCatalog() as any
  const [address, setAddress] = useState('')
  const navigate = useNavigate()
  const showingAssets = kind === 'assets'
  const trimmedAddress = address.trim()
  const validAddress = looksLikeSolanaAddress(trimmedAddress)

  return <div className="iris-shell"><Navbar />
    <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Solana explorer</p><h1>{showingAssets ? 'Asset catalog' : 'Public wallet lookup'}</h1><p>{showingAssets ? 'Assets available through the public Iris Worker catalog.' : 'Paste any public Solana address to view its current portfolio and activity.'}</p></div>{showingAssets && <span className="iris-block">{assets.length} tracked</span>}</section>
      {showingAssets ? (loading ? <p className="iris-empty">Loading catalog...</p> : error ? <p className="iris-empty">Catalog data is currently unavailable.</p> : <section className="iris-catalog-grid">
        {assets.map((asset: any) => <Link key={asset.mint || asset.symbol} className="iris-catalog-card" to={`/asset/${encodeURIComponent(asset.mint || asset.symbol)}`}><AssetIcon src={asset.image_uri} symbol={asset.symbol} /><div><strong>{asset.symbol}</strong><small>{asset.name}</small></div><span>{asset.price_usd === null || asset.price_usd === undefined ? 'Price unavailable' : `$${Number(asset.price_usd).toLocaleString('en-US', { maximumFractionDigits: 5 })}`}</span></Link>)}
      </section>) : <section className="iris-section"><div className="iris-search"><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Solana wallet address" aria-label="Solana wallet address" /><button className="iris-retry" disabled={!validAddress} onClick={() => navigate(`/wallet/${encodeURIComponent(trimmedAddress)}`)}>View wallet</button></div>{address && !validAddress && <p className="iris-empty">Enter a valid Base58 Solana address.</p>}</section>}
    </main>
  </div>
}
