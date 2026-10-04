import { useState } from 'react'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import AssetIcon from './AssetIcon'
import Navbar from './Navbar'
import { AreaChart, MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'

type Asset = {
  mint: string
  symbol: string
  name?: string
  image_uri?: string
  price_usd?: number
  market_cap_usd?: number
  change_24h?: number
  change_7d?: number
  change_30d?: number
}

const currency = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`

const assetColumns: VirtualTableColumn<Asset>[] = [
  { id: 'asset', label: 'Asset', width: 190, value: (asset) => `${asset.symbol} ${asset.name || ''}`, cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.image_uri} symbol={asset.symbol} /><strong>{asset.symbol}</strong><small>{asset.name}</small></span> },
  { id: 'price', label: 'Price', width: 120, align: 'right', value: (asset) => asset.price_usd ?? -1, cell: (asset) => currency(asset.price_usd, 5) },
  { id: 'day', label: '24H', width: 90, align: 'right', value: (asset) => asset.change_24h ?? -Infinity, cell: (asset) => <Change value={asset.change_24h} /> },
  { id: 'week', label: '7D', width: 90, align: 'right', value: (asset) => asset.change_7d ?? -Infinity, cell: (asset) => <Change value={asset.change_7d} /> },
  { id: 'marketCap', label: 'Market cap', width: 160, align: 'right', value: (asset) => asset.market_cap_usd ?? -1, cell: (asset) => currency(asset.market_cap_usd) },
]

export default function Home() {
  const [rangeDays, setRangeDays] = useState(365)
  const [selectedMint, setSelectedMint] = useState('So11111111111111111111111111111111111111112')
  const { assets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog() as any
  const selectedAssetResult = useWorkerResource((options: any) => workerApi.asset(selectedMint, options), [selectedMint]) as any
  const swaps = useWorkerResource(workerApi.swaps, []) as any
  const catalogAssets = assets as Asset[]
  const selectedAsset = selectedAssetResult.data ? (selectedAssetResult.data.asset || selectedAssetResult.data) : null
  const history = assetHistoryFrom(selectedAsset).sort((left, right) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const firstDate = new Date()
  firstDate.setDate(firstDate.getDate() - rangeDays)
  const visibleHistory = history.filter(([date]) => rangeDays === 1000 || new Date(date) >= firstDate).map(([date, value]) => ({ date, value: Number(value) }))
  const selectedPrice = selectedAsset?.price ?? selectedAsset?.price_usd
  const selectedSymbol = selectedAsset?.symbol || catalogAssets.find((asset) => asset.mint === selectedMint)?.symbol || 'SOL'
  const recentSwaps = swapsFrom(swaps.data).slice(0, 5)

  return <div className="iris-shell">
    <Navbar />
    <DataStatus meta={selectedAssetResult.meta || catalogMeta} error={selectedAssetResult.error || catalogError} onRetry={() => { selectedAssetResult.refetch(); swaps.refetch(); }} refreshing={selectedAssetResult.refreshing || swaps.refreshing} />
    {(selectedAssetResult.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Solana explorer</p><h1>Market overview</h1><p>Public market, asset, and on-demand wallet data from the Iris Worker.</p></div><span className="iris-block">{selectedAssetResult.meta?.marketDataAsOf ? `Updated ${selectedAssetResult.meta.marketDataAsOf}` : 'Market time unavailable'}</span></section>
      <section className="iris-metrics">
        <MetricCard label={`${selectedSymbol} price`} value={currency(selectedPrice, 5)} detail="Selected asset's current Jupiter price" />
        <MetricCard label="Tracked assets" value={catalogAssets.length.toLocaleString()} detail="Verified public assets in the Worker catalog" />
        <MetricCard label="Wallet lookup" value="Public" detail="No connection or private data required" />
      </section>
      <section className="iris-dashboard-grid">
        <div className="iris-panel iris-chart-panel"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price history</p><h2>{selectedSymbol} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className={rangeDays === days ? 'active' : ''} onClick={() => setRangeDays(days as number)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No price history available.</p>}</div>
        <div className="iris-panel iris-activity-panel"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Recent swaps</p><h2>Activity feed</h2></div><span>{recentSwaps.length} events</span></div>{recentSwaps.length ? <div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.transaction || swap.date}-${index}`}><div><strong>{swap.type || 'SWAP'}</strong><span>{swap.asset?.symbol || swap.maker || 'Verified DEX transaction'}</span></div><div><strong>{swap.value?.amount === undefined ? 'Details unavailable' : currency(swap.value.amount)}</strong><small>{swap.date || 'Date unavailable'}</small></div></div>)}</div> : <p className="iris-empty">No recent indexed Solana DEX swaps are available.</p>}</div>
      </section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Market catalog</p><h2>Assets</h2></div><span>{catalogAssets.length} tracked</span></div><VirtualTable columns={assetColumns} data={catalogAssets} emptyLabel="No assets are available." filterPlaceholder="Filter assets" onRowClick={(asset: Asset) => setSelectedMint(asset.mint)} /></section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-muted">—</span>
  const change = Number(value)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}
