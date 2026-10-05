import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { AreaChart, MetricCard } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'

const currency = (value: number | null | undefined, digits = 5) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`
const quantity = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })

export default function Asset() {
  const { mint = '' } = useParams(); const [rangeDays, setRangeDays] = useState(365)
  const result = useWorkerResource((options: any) => workerApi.asset(mint, options), [mint]) as any
  const historyResult = useWorkerResource((options: any) => workerApi.assetHistory(mint, options), [mint]) as any
  const asset = assetsFrom(result.data?.asset || result.data ? [result.data?.asset || result.data] : [])[0] as any
  const history = assetHistoryFrom(historyResult.data).sort((left, right) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - rangeDays)
  const visibleHistory = history.filter(([date]) => rangeDays === 1000 || new Date(date) >= fromDate).map(([date, value]) => ({ date, value: Number(value) }))
  const explorerUrl = solanaExplorerUrl('address', asset?.mint)
  const metrics = asset && [
    asset.priceUsd != null && <MetricCard key="price" label="Price" value={currency(asset.priceUsd)} detail="Jupiter current metric" />,
    asset.marketCapUsd != null && <MetricCard key="cap" label="Market cap" value={currency(asset.marketCapUsd, 2)} detail="Jupiter current metric" />,
    asset.circulatingSupply != null && <MetricCard key="supply" label="Circulating supply" value={quantity(asset.circulatingSupply)} detail="Reported supply" />,
    asset.fullyDilutedValuationUsd != null && <MetricCard key="fdv" label="Fully diluted valuation" value={currency(asset.fullyDilutedValuationUsd)} detail="Jupiter current metric" />,
    asset.liquidityUsd != null && <MetricCard key="liq" label="Liquidity" value={currency(asset.liquidityUsd)} detail="Jupiter current metric" />,
    asset.quality?.organicScore != null && <MetricCard key="quality" label="Organic score" value={String(asset.quality.organicScore)} detail={asset.quality.organicScoreLabel || 'Worker quality signal'} />,
  ].filter(Boolean)
  const activity = asset?.activity
  const auditIndicators = Object.entries(asset?.quality?.audit || {}).filter(([, value]) => value === true).map(([key]) => key)
  return <div className="iris-shell"><Navbar /><DataStatus meta={result.meta || historyResult.meta} error={result.error || historyResult.error} onRetry={() => { result.refetch(); historyResult.refetch() }} refreshing={result.refreshing || historyResult.refreshing} />
    {result.loading || historyResult.loading ? <main className="iris-loading">Loading asset data...</main> : result.error ? <main className="iris-loading">Asset data is currently unavailable from the Worker.</main> : !asset ? <main className="iris-loading">No asset was returned for {mint}.</main> : <main className="iris-page">
      <section className="iris-asset-heading"><div className="iris-asset-identity"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><div><p className="iris-eyebrow">Solana asset</p><h1>{asset.name} <span>{asset.symbol}</span></h1>{explorerUrl && <a href={explorerUrl} target="_blank" rel="noopener noreferrer" title={asset.mint}>{asset.mint}</a>}</div></div>{asset.change24hPct != null && <Change value={asset.change24hPct} />}</section>
      {metrics.length > 0 && <section className="iris-metrics">{metrics}</section>}
       {auditIndicators.length > 0 && <p className="iris-disclosure"><strong>Jupiter audit indicators:</strong> {auditIndicators.join(', ')}. This is provider metadata, not a safety assessment or guarantee.</p>}
       {(activity?.buyVolume24hUsd != null || activity?.sellVolume24hUsd != null || activity?.volume24hUsd != null) && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Jupiter trading activity</p><h2>24H activity</h2></div></div><div className="iris-metrics iris-panel-metrics">{activity.buyVolume24hUsd != null && <MetricCard label="Buy volume" value={currency(activity.buyVolume24hUsd)} detail="Jupiter 24H activity" />}{activity.sellVolume24hUsd != null && <MetricCard label="Sell volume" value={currency(activity.sellVolume24hUsd)} detail="Jupiter 24H activity" />}{activity.volume24hUsd != null && <MetricCard label="Total volume" value={currency(activity.volume24hUsd)} detail="Jupiter 24H activity" />}</div></section>}
      <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">CoinGecko 7-day history</p><h2>{asset.symbol} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className={rangeDays === days ? 'active' : ''} onClick={() => setRangeDays(days as number)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No CoinGecko history is available.</p>}</section>
    </main>}
  </div>
}

function Change({ value }: { value: number }) { const positive = value >= 0; return <span className={`iris-change ${positive ? 'iris-positive' : 'iris-negative'}`}>{positive ? '+' : ''}{value.toFixed(2)}% 24H</span> }
