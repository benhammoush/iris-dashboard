import { useSearchParams, useNavigate } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import AssetIcon from './AssetIcon'
import Navbar from './Navbar'
import { AreaChart, MetricCard } from '../design-system'

type Asset = { mint: string; symbol: string; name?: string; imageUrl?: string; priceUsd?: number; marketCapUsd?: number; circulatingSupply?: number; totalSupply?: number; fullyDilutedValuationUsd?: number; change24hPct?: number; liquidityUsd?: number; holderCount?: number; activity?: { buyVolume24hUsd?: number; sellVolume24hUsd?: number; volume24hUsd?: number }; quality?: { organicScore?: number; organicScoreLabel?: string; audit?: Record<string, unknown> }; verification?: { isVerified?: boolean; tags?: string[] } }
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const currency = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`
const assetsWithChange = (assets: Asset[]) => assets.filter((asset) => Number.isFinite(Number(asset.change24hPct)))

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedMint = searchParams.get('mint') || SOL_MINT
  const range = ['1h', '4h', '1d', '7d'].includes(searchParams.get('range') || '') ? searchParams.get('range')! : '1d'
  const { assets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog() as any
  const selectedResult = useWorkerResource((options: any) => workerApi.asset(selectedMint, options), [selectedMint]) as any
  const catalogsResult = useWorkerResource(workerApi.catalogs, []) as any
  const historySourceRange = range === '7d' ? '7d' : '1d'
  const historyResult = useWorkerResource((options: any) => workerApi.assetHistory(selectedMint, historySourceRange, options), [selectedMint, historySourceRange]) as any
  const swapsResult = useWorkerResource(workerApi.swaps, []) as any
  const catalogAssets = assets as Asset[]
  const catalogs = catalogsResult.data && typeof catalogsResult.data === 'object' ? catalogsResult.data : {}
  const selectedAsset = assetsFrom(selectedResult.data?.asset || selectedResult.data ? [selectedResult.data?.asset || selectedResult.data] : [])[0] || catalogAssets.find((asset) => asset.mint === selectedMint)
  const history = assetHistoryFrom(historyResult.data).sort((left, right) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const lookbackMs = { '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000, '1d': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000 }[range] || 24 * 60 * 60 * 1000
  const visibleHistory = history.filter(([date]) => new Date(date).valueOf() >= Date.now() - lookbackMs).map(([date, value]) => ({ date, value: Number(value) }))
  const metrics = [
    selectedAsset?.priceUsd != null && <MetricCard key="price" label={`${selectedAsset.symbol} price`} value={currency(selectedAsset.priceUsd, 5)} detail={selectedAsset.change24hPct != null ? <Change value={selectedAsset.change24hPct} /> : undefined} />,
    selectedAsset?.marketCapUsd != null && <MetricCard key="cap" label="Market cap" value={currency(selectedAsset.marketCapUsd)} />,
    selectedAsset?.activity?.volume24hUsd != null && <MetricCard key="volume" label="24H volume" value={currency(selectedAsset.activity.volume24hUsd)} />,
    selectedAsset?.liquidityUsd != null && <MetricCard key="liquidity" label="Liquidity" value={currency(selectedAsset.liquidityUsd)} />,
  ].filter(Boolean)
  const setSelection = (mint: string, nextRange = range) => setSearchParams({ mint, range: nextRange })
  const recentSwaps = swapsFrom(swapsResult.data).slice(0, 5)
  const movers = assetsWithChange(catalogAssets)
  const strongestAsset = movers.reduce<Asset | null>((best, asset) => !best || Number(asset.change24hPct) > Number(best.change24hPct) ? asset : best, null)
  const weakestAsset = movers.reduce<Asset | null>((worst, asset) => !worst || Number(asset.change24hPct) < Number(worst.change24hPct) ? asset : worst, null)

  return <div className="iris-shell"><Navbar />
    <DataStatus meta={selectedResult.meta || historyResult.meta || catalogsResult.meta || catalogMeta} error={selectedResult.error || historyResult.error || catalogsResult.error || catalogError} />
    {(selectedResult.loading || historyResult.loading || catalogsResult.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Market monitor</p><h1>Market overview</h1><p>Current metrics, history, and reviewed-pool activity from the Iris Worker.</p></div></section>
      {metrics.length > 0 && <section className="iris-metrics">{metrics}</section>}
       <section className="iris-dashboard-grid">
         <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price history</p><h2>{selectedAsset?.symbol || 'SOL'} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[['1h', '1H'], ['4h', '4H'], ['1d', '1D'], ['7d', '7D']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setSelection(selectedMint, value)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <div className="iris-chart-empty"><strong>No price history is available for the {range.toUpperCase()} range.</strong><p>Try another range or select a different asset from the catalog.</p></div>}</section>
         <aside className="iris-section iris-market-pulse" aria-label="Market pulse"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Catalog signal</p><h2>Market pulse</h2></div></div><dl className="iris-pulse-list">
           <PulseItem label="Strongest 24H" value={strongestAsset?.symbol || '—'} detail={strongestAsset ? <Change value={strongestAsset.change24hPct} /> : undefined} />
           <PulseItem label="Weakest 24H" value={weakestAsset?.symbol || '—'} detail={weakestAsset ? <Change value={weakestAsset.change24hPct} /> : undefined} />
         </dl></aside>
       </section>
      {recentSwaps.length > 0 && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Global reviewed-pool activity</p><h2>Recent swaps</h2></div><span>{recentSwaps.length} events</span></div><div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.id || swap.timestamp}-${index}`}><div><strong>{swap.type}</strong><span>{swap.maker || 'Reviewed pool participant'}</span></div><div><small>{swap.timestamp || 'Time unavailable'}</small></div></div>)}</div></section>}
       <section className="iris-catalog-lists" aria-label="Jupiter discovery catalogs">
         <CatalogList title="Top traded" detail="Jupiter 24H activity" assets={assetsFrom(catalogs.topTraded || catalogAssets) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
         <CatalogList title="Trending" detail="Jupiter 24H momentum" assets={assetsFrom(catalogs.trending) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
         <CatalogList title="Recent" detail="New Jupiter pools" assets={assetsFrom(catalogs.recent) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
       </section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-muted">—</span>
  const change = Number(value)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}

function PulseItem({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}{detail !== undefined && <small>{detail}</small>}</dd></div>
}

function CatalogList({ title, detail, assets, onSelect }: { title: string; detail: string; assets: Asset[]; onSelect: (asset: Asset) => void }) {
  return <section className="iris-section iris-catalog-list"><div className="iris-panel-heading"><div><p className="iris-eyebrow">{detail}</p><h2>{title}</h2></div></div>{assets.length ? <div className="iris-catalog-list-rows">{assets.slice(0, 10).map((asset) => <button key={asset.mint} onClick={() => onSelect(asset)}><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small>{asset.verification?.isVerified === false && <em>Unverified</em>}</span><span className="iris-catalog-list-price">{currency(asset.priceUsd, 5)}<Change value={asset.change24hPct} /></span></button>)}</div> : <p className="iris-empty">No assets are available.</p>}</section>
}
