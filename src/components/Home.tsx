import { useSearchParams, useNavigate } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom, networkFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import { useCatalog } from '../contexts/CatalogContext'
import DataStatus from './DataStatus'
import AssetIcon from './AssetIcon'
import Navbar from './Navbar'
import HeliusNetworkCard from './HeliusNetworkCard'
import { AreaChart, MetricCard } from '../design-system'

type Asset = { mint: string; symbol: string; name?: string; imageUrl?: string; priceUsd?: number; marketCapUsd?: number; circulatingSupply?: number; totalSupply?: number; fullyDilutedValuationUsd?: number; change24hPct?: number; liquidityUsd?: number; holderCount?: number; activity?: { buyVolume24hUsd?: number; sellVolume24hUsd?: number; volume24hUsd?: number }; quality?: { organicScore?: number; organicScoreLabel?: string; audit?: Record<string, unknown> }; verification?: { isVerified?: boolean; tags?: string[] } }
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const currency = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`

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
  const networkResult = useWorkerResource(workerApi.network, []) as any
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
  const network = networkFrom(networkResult.data)

  return <div className="iris-shell"><Navbar market={selectedAsset} network={network} />
    <DataStatus meta={selectedResult.meta || historyResult.meta || catalogsResult.meta || catalogMeta} error={selectedResult.error || historyResult.error || catalogsResult.error || catalogError} />
    {(selectedResult.loading || historyResult.loading || catalogsResult.loading || catalogLoading) ? <main className="iris-loading">Loading market data...</main> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Market monitor</p><h1>Market overview</h1><p>Current metrics, history, and reviewed-pool activity from the Iris Worker.</p></div></section>
      <HeliusNetworkCard network={network} loading={networkResult.loading} error={networkResult.error} />
       <section className="iris-dashboard-grid">
         <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price history</p><h2>{selectedAsset?.symbol || 'SOL'} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[['1h', '1H'], ['4h', '4H'], ['1d', '1D'], ['7d', '7D']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setSelection(selectedMint, value)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <div className="iris-chart-empty"><strong>No price history is available for the {range.toUpperCase()} range.</strong><p>Try another range or select a different asset from the catalog.</p></div>}</section>
       </section>
      {recentSwaps.length > 0 && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Global reviewed-pool activity</p><h2>Recent swaps</h2></div><span>{recentSwaps.length} events</span></div><div className="iris-activity-list">{recentSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.id || swap.timestamp}-${index}`}><div><strong>{swap.type}</strong><span>{swap.maker || 'Reviewed pool participant'}</span></div><div><small>{swap.timestamp || 'Time unavailable'}</small></div></div>)}</div></section>}
        <section className="iris-section iris-jupiter-dex" aria-label="Jupiter discovery catalogs">
          <div className="iris-jupiter-dex-label"><JupiterLogo /><div><p>Jupiter</p><h2>Jupiter DEX</h2></div><span>DEX</span></div>
          <div className="iris-catalog-lists">
            <CatalogList title="Top Volume" tone="volume" assets={assetsFrom(catalogs.topTraded || catalogAssets) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
            <CatalogList title="Trending" tone="trending" assets={assetsFrom(catalogs.trending) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
            <CatalogList title="New tokens" tone="pools" assets={assetsFrom(catalogs.recent) as Asset[]} onSelect={(asset) => navigate(`/asset/${encodeURIComponent(asset.mint)}`)} />
          </div>
        </section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-muted">—</span>
  const change = Number(value)
  return <span className={change >= 0 ? 'iris-positive' : 'iris-negative'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
}

function JupiterLogo() {
  return <span className="iris-jupiter-mark" aria-hidden="true"><svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#iris-jupiter-logo-clip)"><g filter="url(#iris-jupiter-logo-filter)"><path d="M3.09074 25.1666C4.44267 27.0471 6.17683 28.6205 8.1795 29.7838C10.1822 30.947 12.4081 31.6738 14.7114 31.9165C13.5264 30.1333 11.8039 28.4928 9.65354 27.2438C7.50318 25.9948 5.22592 25.3125 3.09074 25.1666Z" fill="url(#iris-jupiter-logo-gradient)" /><path d="M12.543 22.2705C8.40015 19.8636 3.91612 19.2502 0.707663 20.3338C1.0174 21.3575 1.42589 22.3487 1.92738 23.2934C4.71498 23.2288 7.75856 23.9859 10.5906 25.6308C13.4227 27.2757 15.5888 29.5459 16.9143 32C17.9839 31.9672 19.0479 31.8309 20.0913 31.5932C19.4426 28.2698 16.6849 24.6779 12.543 22.2705Z" fill="url(#iris-jupiter-logo-gradient)" /><path d="M32.2852 12.5009C31.7585 10.3584 30.8054 8.34403 29.4829 6.57804C28.1604 4.81205 26.4956 3.33067 24.5879 2.22235C22.6802 1.11403 20.5687 0.401504 18.3796 0.127309C16.1904 -0.146885 13.9684 0.0228794 11.8463 0.626465C15.3915 1.06033 19.3267 2.39122 23.1859 4.63324C27.0452 6.87525 30.1533 9.63411 32.2852 12.5009Z" fill="url(#iris-jupiter-logo-gradient)" /><path d="M27.1271 20.3583C25.3124 17.3446 22.2038 14.4588 18.3743 12.2342C14.5449 10.0095 10.4991 8.7388 6.98531 8.65474C3.894 8.58152 1.57389 9.48017 0.621548 11.1197C0.616125 11.1294 0.608532 11.1386 0.602566 11.1484C0.516877 11.4559 0.44312 11.7639 0.37587 12.0731C1.70568 11.5481 3.24645 11.2558 4.95969 11.2232C8.76959 11.1517 13.0334 12.3703 16.9681 14.6562C20.9027 16.9422 24.0759 20.0438 25.9003 23.3878C26.7182 24.8944 27.2285 26.3777 27.4308 27.7948C27.6662 27.5844 27.8972 27.3669 28.1212 27.1408C28.1272 27.1305 28.131 27.1196 28.1369 27.1088C29.0893 25.4677 28.721 23.0076 27.1271 20.3583Z" fill="url(#iris-jupiter-logo-gradient)" /><path d="M15.4609 17.2485C9.59662 13.8416 3.11626 13.3079 0 15.6855C0.00612096 16.4297 0.0630166 17.1726 0.170292 17.9091C1.08699 17.6312 2.03177 17.4562 2.98718 17.3874C6.46952 17.1254 10.3087 18.0957 13.7927 20.1207C17.2766 22.1458 20.023 25.0018 21.5209 28.1543C21.935 29.018 22.2508 29.9254 22.4624 30.8595C23.1555 30.5878 23.8294 30.2694 24.4794 29.9066C25.0011 26.0213 21.3268 20.656 15.4609 17.2485Z" fill="url(#iris-jupiter-logo-gradient)" /><path d="M30.1434 15.3141C28.3082 12.3036 25.1724 9.40969 21.3158 7.17039C17.4593 4.93109 13.3977 3.64033 9.87257 3.53674C7.1853 3.45919 5.10382 4.11053 4.02457 5.34109C8.50588 4.58182 14.4168 5.85794 20.146 9.18625C25.8753 12.5146 29.9135 17.0181 31.4722 21.2868C32.0064 19.7406 31.5416 17.6098 30.1434 15.3141Z" fill="url(#iris-jupiter-logo-gradient)" /></g></g><defs><filter id="iris-jupiter-logo-filter" x="-22.7449" y="-20.4704" width="77.7749" height="77.4898" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" /><feOffset dy="2.27449" /><feGaussianBlur stdDeviation="11.3724" /><feComposite in2="hardAlpha" operator="out" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" /><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" /><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" /></filter><linearGradient id="iris-jupiter-logo-gradient" x1="21.5" y1="6.5" x2="6.66667" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0.0001" stopColor="#C7F284" /><stop offset="1" stopColor="#00BEF0" /></linearGradient><clipPath id="iris-jupiter-logo-clip"><rect width="32.2852" height="32" fill="white" /></clipPath></defs></svg></span>
}

function CatalogList({ title, tone, assets, onSelect }: { title: string; tone: 'volume' | 'trending' | 'pools'; assets: Asset[]; onSelect: (asset: Asset) => void }) {
  return <section className={`iris-section iris-catalog-list iris-catalog-list--${tone}`}><div className="iris-catalog-list-heading"><span aria-hidden="true" /><h2>{title}</h2></div>{assets.length ? <div className="iris-catalog-list-rows">{assets.map((asset) => <button key={asset.mint} onClick={() => onSelect(asset)}><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><span className="iris-catalog-list-identity"><strong>{asset.symbol}</strong><small>{asset.name}</small><small>Volume {currency(asset.activity?.volume24hUsd)}</small>{asset.verification?.isVerified === false && <em>Unverified</em>}</span><span className="iris-catalog-list-price">{currency(asset.priceUsd, 5)}<Change value={asset.change24hPct} /></span></button>)}</div> : <p className="iris-empty">No assets are available.</p>}</section>
}
