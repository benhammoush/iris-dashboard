import { useSearchParams, useNavigate } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import AssetIcon from './AssetIcon'
import Navbar from './Navbar'
import { AreaChart, MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'

type Asset = { mint: string; symbol: string; name?: string; imageUrl?: string; priceUsd?: number; marketCapUsd?: number; circulatingSupply?: number; totalSupply?: number; fullyDilutedValuationUsd?: number; change24hPct?: number; liquidityUsd?: number; holderCount?: number; activity?: { buyVolume24hUsd?: number; sellVolume24hUsd?: number; volume24hUsd?: number }; quality?: { organicScore?: number; organicScoreLabel?: string; audit?: Record<string, unknown> }; verification?: { isVerified?: boolean; tags?: string[] } }
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const currency = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`
const quantity = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
const audit = (asset: Asset) => Object.entries(asset.quality?.audit || {}).filter(([, value]) => value === true).map(([key]) => key).join(', ') || '—'

const assetColumns: VirtualTableColumn<Asset>[] = [
  { id: 'asset', label: 'Asset', width: 210, value: (asset) => `${asset.symbol} ${asset.name || ''}`, cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><strong>{asset.symbol}</strong><small>{asset.name}</small></span> },
  { id: 'price', label: 'Price', width: 120, align: 'right', value: (asset) => asset.priceUsd ?? -1, cell: (asset) => currency(asset.priceUsd, 5) },
  { id: 'day', label: '24H', width: 90, align: 'right', value: (asset) => asset.change24hPct ?? -Infinity, cell: (asset) => <Change value={asset.change24hPct} /> },
  { id: 'marketCap', label: 'Market cap', width: 160, align: 'right', value: (asset) => asset.marketCapUsd ?? -1, cell: (asset) => currency(asset.marketCapUsd) },
  { id: 'fdv', label: 'FDV', width: 160, align: 'right', value: (asset) => asset.fullyDilutedValuationUsd ?? -1, cell: (asset) => currency(asset.fullyDilutedValuationUsd) },
  { id: 'circulatingSupply', label: 'Circulating', width: 150, align: 'right', value: (asset) => asset.circulatingSupply ?? -1, cell: (asset) => quantity(asset.circulatingSupply) },
  { id: 'totalSupply', label: 'Total supply', width: 150, align: 'right', value: (asset) => asset.totalSupply ?? -1, cell: (asset) => quantity(asset.totalSupply) },
  { id: 'liquidity', label: 'Liquidity', width: 140, align: 'right', value: (asset) => asset.liquidityUsd ?? -1, cell: (asset) => currency(asset.liquidityUsd) },
  { id: 'holders', label: 'Holders', width: 110, align: 'right', value: (asset) => asset.holderCount ?? -1, cell: (asset) => quantity(asset.holderCount) },
  { id: 'buyVolume', label: 'Buy 24H', width: 140, align: 'right', value: (asset) => asset.activity?.buyVolume24hUsd ?? -1, cell: (asset) => currency(asset.activity?.buyVolume24hUsd) },
  { id: 'sellVolume', label: 'Sell 24H', width: 140, align: 'right', value: (asset) => asset.activity?.sellVolume24hUsd ?? -1, cell: (asset) => currency(asset.activity?.sellVolume24hUsd) },
  { id: 'volume', label: 'Volume 24H', width: 140, align: 'right', value: (asset) => asset.activity?.volume24hUsd ?? -1, cell: (asset) => currency(asset.activity?.volume24hUsd) },
  { id: 'organicScore', label: 'Organic score', width: 130, align: 'right', value: (asset) => asset.quality?.organicScore ?? -1, cell: (asset) => quantity(asset.quality?.organicScore) },
  { id: 'organicLabel', label: 'Organic label', width: 130, value: (asset) => asset.quality?.organicScoreLabel || '', cell: (asset) => asset.quality?.organicScoreLabel || '—' },
  { id: 'verified', label: 'Verified', width: 100, value: (asset) => asset.verification?.isVerified ? 'yes' : 'no', cell: (asset) => asset.verification?.isVerified ? 'Yes' : 'No' },
  { id: 'tags', label: 'Tags', width: 180, value: (asset) => asset.verification?.tags?.join(' ') || '', cell: (asset) => asset.verification?.tags?.join(', ') || '—' },
  { id: 'audit', label: 'Audit', width: 200, value: audit, cell: audit },
]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedMint = searchParams.get('mint') || SOL_MINT
  const range = ['1h', '4h', '1d', '7d'].includes(searchParams.get('range') || '') ? searchParams.get('range')! : '1d'
  const { assets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog() as any
  const selectedResult = useWorkerResource((options: any) => workerApi.asset(selectedMint, options), [selectedMint]) as any
  const historySourceRange = range === '7d' ? '7d' : '1d'
  const historyResult = useWorkerResource((options: any) => workerApi.assetHistory(selectedMint, historySourceRange, options), [selectedMint, historySourceRange]) as any
  const swapsResult = useWorkerResource(workerApi.swaps, []) as any
  const catalogAssets = assets as Asset[]
  const selectedAsset = assetsFrom(selectedResult.data?.asset || selectedResult.data ? [selectedResult.data?.asset || selectedResult.data] : [])[0] || catalogAssets.find((asset) => asset.mint === selectedMint)
  const history = assetHistoryFrom(historyResult.data).sort((left, right) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const lookbackMs = { '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000, '1d': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000 }[range] || 24 * 60 * 60 * 1000
  const visibleHistory = history.filter(([date]) => new Date(date).valueOf() >= Date.now() - lookbackMs).map(([date, value]) => ({ date, value: Number(value) }))
  const metrics = [
    selectedAsset?.priceUsd != null && <MetricCard key="price" label={`${selectedAsset.symbol} price`} value={currency(selectedAsset.priceUsd, 5)} detail="Jupiter current metric" />,
    selectedAsset?.marketCapUsd != null && <MetricCard key="cap" label="Market cap" value={currency(selectedAsset.marketCapUsd)} detail="Jupiter current metric" />,
    selectedAsset?.change24hPct != null && <MetricCard key="change" label="24H change" value={<Change value={selectedAsset.change24hPct} />} detail="Jupiter current metric" />,
    selectedAsset?.activity?.volume24hUsd != null && <MetricCard key="volume" label="24H volume" value={currency(selectedAsset.activity.volume24hUsd)} detail="Jupiter activity" />,
    selectedAsset?.liquidityUsd != null && <MetricCard key="liquidity" label="Liquidity" value={currency(selectedAsset.liquidityUsd)} detail="Jupiter current metric" />,
    selectedAsset?.quality?.organicScore != null && <MetricCard key="quality" label="Organic score" value={String(selectedAsset.quality.organicScore)} detail={selectedAsset.quality.organicScoreLabel || 'Worker quality signal'} />,
  ].filter(Boolean)
  const setSelection = (mint: string, nextRange = range) => setSearchParams({ mint, range: nextRange })
  const recentSwaps = swapsFrom(swapsResult.data).slice(0, 5)

  return <div className="iris-shell"><Navbar />
    <DataStatus meta={selectedResult.meta || historyResult.meta || catalogMeta} error={selectedResult.error || historyResult.error || catalogError} />
    {(selectedResult.loading || historyResult.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Market monitor</p><h1>Market overview</h1><p>Current metrics, history, and reviewed-pool activity from the Iris Worker.</p></div></section>
      {metrics.length > 0 && <section className="iris-metrics">{metrics}</section>}
      <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">CoinGecko price history</p><h2>{selectedAsset?.symbol || 'SOL'} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[['1h', '1H'], ['4h', '4H'], ['1d', '1D'], ['7d', '7D']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setSelection(selectedMint, value)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No CoinGecko history is available.</p>}</section>
      {recentSwaps.length > 0 && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Global reviewed-pool activity</p><h2>Recent swaps</h2></div><span>{recentSwaps.length} events</span></div><div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.id || swap.timestamp}-${index}`}><div><strong>{swap.type}</strong><span>{swap.maker || 'Reviewed pool participant'}</span></div><div><small>{swap.timestamp || 'Time unavailable'}</small></div></div>)}</div></section>}
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Market catalog</p><h2>Assets</h2></div><span>{catalogAssets.length} tracked</span></div><VirtualTable columns={assetColumns} data={catalogAssets} emptyLabel="No assets are available." filterPlaceholder="Filter assets" pageSize={25} onRowClick={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} /></section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-muted">—</span>
  const change = Number(value)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}
