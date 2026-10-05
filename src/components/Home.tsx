import { useSearchParams, useNavigate } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import AssetIcon from './AssetIcon'
import Navbar from './Navbar'
import { AreaChart, MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'

type Asset = { mint: string; symbol: string; name?: string; imageUrl?: string; priceUsd?: number; marketCapUsd?: number; change24hPct?: number; liquidityUsd?: number; activity?: { volume24hUsd?: number }; quality?: { organicScore?: number; organicScoreLabel?: string } }
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const currency = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`

const assetColumns = (onPreview: (mint: string) => void): VirtualTableColumn<Asset>[] => [
  { id: 'asset', label: 'Asset', width: 210, value: (asset) => `${asset.symbol} ${asset.name || ''}`, cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><strong>{asset.symbol}</strong><small>{asset.name}</small></span> },
  { id: 'price', label: 'Price', width: 120, align: 'right', value: (asset) => asset.priceUsd ?? -1, cell: (asset) => currency(asset.priceUsd, 5) },
  { id: 'day', label: '24H', width: 90, align: 'right', value: (asset) => asset.change24hPct ?? -Infinity, cell: (asset) => <Change value={asset.change24hPct} /> },
  { id: 'marketCap', label: 'Market cap', width: 160, align: 'right', value: (asset) => asset.marketCapUsd ?? -1, cell: (asset) => currency(asset.marketCapUsd) },
  { id: 'preview', label: 'Chart', width: 90, align: 'right', value: (asset) => asset.symbol, cell: (asset) => <button className="iris-preview" onClick={(event) => { event.stopPropagation(); onPreview(asset.mint) }} aria-label={`Preview ${asset.symbol}`}>Preview</button> },
]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedMint = searchParams.get('mint') || SOL_MINT
  const rangeDays = Number(searchParams.get('range')) || 365
  const { assets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog() as any
  const selectedResult = useWorkerResource((options: any) => workerApi.asset(selectedMint, options), [selectedMint]) as any
  const historyResult = useWorkerResource((options: any) => workerApi.assetHistory(selectedMint, options), [selectedMint]) as any
  const swapsResult = useWorkerResource(workerApi.swaps, []) as any
  const catalogAssets = assets as Asset[]
  const selectedAsset = assetsFrom(selectedResult.data?.asset || selectedResult.data ? [selectedResult.data?.asset || selectedResult.data] : [])[0] || catalogAssets.find((asset) => asset.mint === selectedMint)
  const history = assetHistoryFrom(historyResult.data).sort((left, right) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const firstDate = new Date(); firstDate.setDate(firstDate.getDate() - rangeDays)
  const visibleHistory = history.filter(([date]) => rangeDays === 1000 || new Date(date) >= firstDate).map(([date, value]) => ({ date, value: Number(value) }))
  const metrics = [
    selectedAsset?.priceUsd != null && <MetricCard key="price" label={`${selectedAsset.symbol} price`} value={currency(selectedAsset.priceUsd, 5)} detail="Jupiter current metric" />,
    selectedAsset?.marketCapUsd != null && <MetricCard key="cap" label="Market cap" value={currency(selectedAsset.marketCapUsd)} detail="Jupiter current metric" />,
    selectedAsset?.change24hPct != null && <MetricCard key="change" label="24H change" value={<Change value={selectedAsset.change24hPct} />} detail="Jupiter current metric" />,
    selectedAsset?.activity?.volume24hUsd != null && <MetricCard key="volume" label="24H volume" value={currency(selectedAsset.activity.volume24hUsd)} detail="Jupiter activity" />,
    selectedAsset?.liquidityUsd != null && <MetricCard key="liquidity" label="Liquidity" value={currency(selectedAsset.liquidityUsd)} detail="Jupiter current metric" />,
    selectedAsset?.quality?.organicScore != null && <MetricCard key="quality" label="Organic score" value={String(selectedAsset.quality.organicScore)} detail={selectedAsset.quality.organicScoreLabel || 'Worker quality signal'} />,
  ].filter(Boolean)
  const setSelection = (mint: string, range = rangeDays) => setSearchParams({ mint, range: String(range) })
  const recentSwaps = swapsFrom(swapsResult.data).slice(0, 5)

  return <div className="iris-shell"><Navbar />
    <DataStatus meta={selectedResult.meta || historyResult.meta || catalogMeta} error={selectedResult.error || historyResult.error || catalogError} onRetry={() => { selectedResult.refetch(); historyResult.refetch(); swapsResult.refetch() }} refreshing={selectedResult.refreshing || historyResult.refreshing || swapsResult.refreshing} />
    {(selectedResult.loading || historyResult.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Market monitor</p><h1>Market overview</h1><p>Current metrics, history, and reviewed-pool activity from the Iris Worker.</p></div></section>
      {metrics.length > 0 && <section className="iris-metrics">{metrics}</section>}
      <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">CoinGecko 7-day history</p><h2>{selectedAsset?.symbol || 'SOL'} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className={rangeDays === days ? 'active' : ''} onClick={() => setSelection(selectedMint, days as number)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No CoinGecko history is available.</p>}</section>
      {recentSwaps.length > 0 && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Global reviewed-pool activity</p><h2>Recent swaps</h2></div><span>{recentSwaps.length} events</span></div><div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.id || swap.timestamp}-${index}`}><div><strong>{swap.type}</strong><span>{swap.maker || 'Reviewed pool participant'}</span></div><div><small>{swap.timestamp || 'Time unavailable'}</small></div></div>)}</div></section>}
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Market catalog</p><h2>Assets</h2></div><span>{catalogAssets.length} tracked</span></div><VirtualTable columns={assetColumns(setSelection)} data={catalogAssets} emptyLabel="No assets are available." filterPlaceholder="Filter assets" onRowClick={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} /></section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-muted">—</span>
  const change = Number(value)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}
