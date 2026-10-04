import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { marketHistoryFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import { AreaChart, MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'

type Asset = {
  symbol: string
  name?: string
  image_uri?: string
  price_usd?: number
  market_cap_usd?: number
  change_24h?: number
  change_7d?: number
  change_30d?: number
}

const currency = (value: number, digits = 2) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: digits })}`

const assetColumns: VirtualTableColumn<Asset>[] = [
  { id: 'asset', label: 'Asset', width: 190, value: (asset) => `${asset.symbol} ${asset.name || ''}`, cell: (asset) => <span className="iris-asset-cell">{asset.image_uri && <img src={asset.image_uri} alt="" />}<strong>{asset.symbol}</strong><small>{asset.name}</small></span> },
  { id: 'price', label: 'Price', width: 120, align: 'right', value: (asset) => asset.price_usd || 0, cell: (asset) => currency(asset.price_usd || 0, 5) },
  { id: 'day', label: '24H', width: 90, align: 'right', value: (asset) => asset.change_24h || 0, cell: (asset) => <Change value={asset.change_24h} /> },
  { id: 'week', label: '7D', width: 90, align: 'right', value: (asset) => asset.change_7d || 0, cell: (asset) => <Change value={asset.change_7d} /> },
  { id: 'marketCap', label: 'Market cap', width: 160, align: 'right', value: (asset) => asset.market_cap_usd || 0, cell: (asset) => currency(asset.market_cap_usd || 0) },
]

export default function Home() {
  const [rangeDays, setRangeDays] = useState(365)
  const { assets, wallets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog() as any
  const navigate = useNavigate()
  const market = useWorkerResource(workerApi.market, []) as any
  const swaps = useWorkerResource(workerApi.swaps, []) as any
  const sortedAssets = [...assets].sort((left: Asset, right: Asset) => Number(right.market_cap_usd || 0) - Number(left.market_cap_usd || 0)) as Asset[]
  const history = marketHistoryFrom(market.data, sortedAssets).sort((left: [string, number], right: [string, number]) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const firstDate = new Date()
  firstDate.setDate(firstDate.getDate() - rangeDays)
  const visibleHistory = history.filter(([date]) => rangeDays === 1000 || new Date(date) >= firstDate).map(([date, value]) => ({ date, value: Number(value) }))
  const latestMarketCap = visibleHistory.at(-1)?.value || history.at(-1)?.[1] || 0
  const recentSwaps = swapsFrom(swaps.data).slice(0, 5)

  return <div className="iris-shell">
    <Navbar fees={market.data?.fees} />
    <DataStatus meta={market.meta || catalogMeta} error={market.error || catalogError} />
    {(market.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Stacks explorer</p><h1>Market overview</h1><p>Public market, asset, and curated-wallet data from the Iris Worker.</p></div><span className="iris-block">{market.data?.block_height ? `Block ${market.data.block_height}` : 'Block unavailable'}</span></section>
      <section className="iris-metrics">
        <MetricCard label="Stacks market cap" value={currency(latestMarketCap)} detail="Supported assets, aggregated from current history" />
        <MetricCard label="Tracked assets" value={sortedAssets.length.toLocaleString()} detail="Public assets in the Worker catalog" />
        <MetricCard label="Curated wallets" value={wallets.length.toLocaleString()} detail="No connection or private data required" />
      </section>
      <section className="iris-dashboard-grid">
        <div className="iris-panel iris-chart-panel"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Market history</p><h2>{currency(latestMarketCap)}</h2></div><div className="iris-range" aria-label="Market history range">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className={rangeDays === days ? 'active' : ''} onClick={() => setRangeDays(days as number)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No market history available.</p>}</div>
        <div className="iris-panel iris-activity-panel"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Recent swaps</p><h2>Activity feed</h2></div><span>{recentSwaps.length} events</span></div>{recentSwaps.length ? <div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.transaction || swap.date}-${index}`}><div><strong className={swap.type === 'BUY' ? 'iris-positive' : 'iris-negative'}>{swap.type || 'SWAP'}</strong><span>{swap.asset?.symbol || 'Unknown asset'}</span></div><div><strong>{currency(swap.value?.amount || 0)}</strong><small>{swap.date || 'Date unavailable'}</small></div></div>)}</div> : <p className="iris-empty">No recent swaps available.</p>}</div>
      </section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Market catalog</p><h2>Assets</h2></div><span>{sortedAssets.length} tracked</span></div><VirtualTable columns={assetColumns} data={sortedAssets} emptyLabel="No assets are available." filterPlaceholder="Filter assets" onRowClick={(asset) => navigate(`/asset/${asset.symbol}`)} /></section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Public addresses</p><h2>Featured wallets</h2></div></div><div className="iris-wallet-grid">{wallets.length ? wallets.map((wallet: any) => <Link key={wallet.address} to={`/wallet/${wallet.address}`} className="iris-wallet-card"><span className="iris-live-dot" /><strong>{wallet.label || wallet.address}</strong><small>{wallet.description || wallet.address}</small></Link>) : <p className="iris-empty">No featured wallets are configured.</p>}</div></section>
    </main>}
  </div>
}

function Change({ value }: { value?: number }) {
  const change = Number(value || 0)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}
