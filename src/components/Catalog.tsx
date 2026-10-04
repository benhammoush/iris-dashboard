import { Link } from 'react-router-dom'
import { useCatalog } from '../contexts/CatalogContext'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'

export default function Catalog({ kind }: { kind: 'assets' | 'wallets' }) {
  const { assets, wallets, loading, error } = useCatalog() as any
  const showingAssets = kind === 'assets'
  const items = showingAssets ? assets : wallets

  return <div className="iris-shell"><Navbar />
    <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Stacks explorer</p><h1>{showingAssets ? 'Asset catalog' : 'Curated wallets'}</h1><p>{showingAssets ? 'Assets available through the public Iris Worker catalog.' : 'Public addresses selected for portfolio and activity monitoring.'}</p></div><span className="iris-block">{items.length} tracked</span></section>
      {loading ? <p className="iris-empty">Loading catalog...</p> : error ? <p className="iris-empty">Catalog data is currently unavailable.</p> : <section className="iris-catalog-grid">
        {showingAssets ? items.map((asset: any) => <Link key={asset.contractId || asset.contract_principal || asset.asset_identifier || asset.symbol} className="iris-catalog-card" to={`/asset/${encodeURIComponent(asset.contractId || asset.contract_principal || asset.asset_identifier || asset.symbol)}`}><AssetIcon src={asset.image_uri} symbol={asset.symbol} /><div><strong>{asset.symbol}</strong><small>{asset.name}</small></div><span>{asset.price_usd === null || asset.price_usd === undefined ? 'Price unavailable' : `$${Number(asset.price_usd).toLocaleString('en-US', { maximumFractionDigits: 5 })}`}</span></Link>) : items.map((wallet: any) => <Link key={wallet.address} className="iris-catalog-card" to={`/wallet/${wallet.address}`}><span className="iris-live-dot" /><div><strong>{wallet.label || wallet.address}</strong><small>{wallet.description || wallet.address}</small></div><span>View</span></Link>)}
      </section>}
    </main>
  </div>
}
