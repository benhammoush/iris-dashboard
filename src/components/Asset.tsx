import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetCandlesFrom, assetsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { CandlestickChart, MetricCard } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'

const currency = (value: number | null | undefined, digits = 5) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`
const quantity = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })

export default function Asset() {
  const { mint = '' } = useParams(); const [range, setRange] = useState('1d')
  const [olderCandles, setOlderCandles] = useState<any[]>([])
  const [canLoadEarlier, setCanLoadEarlier] = useState(true)
  const loadingOlderRef = useRef(false)
  const result = useWorkerResource((options: any) => workerApi.asset(mint, options), [mint]) as any
  const candlesResult = useWorkerResource((options: any) => workerApi.assetCandles(mint, range, options), [mint, range]) as any
  const asset = assetsFrom(result.data?.asset || result.data ? [result.data?.asset || result.data] : [])[0] as any
  const baseCandles = assetCandlesFrom(candlesResult.data)
  const candlesByTimestamp = new Map<string, any>()
  for (const candle of [...olderCandles, ...baseCandles]) candlesByTimestamp.set(candle.timestamp, candle)
  const candles = [...candlesByTimestamp.values()].sort((left: any, right: any) => new Date(left.timestamp).valueOf() - new Date(right.timestamp).valueOf())
  useEffect(() => { setOlderCandles([]); setCanLoadEarlier(true); loadingOlderRef.current = false }, [mint, range])
  async function loadEarlierCandles() {
    if (loadingOlderRef.current || !canLoadEarlier || !candles.length) return
    const oldestTimestamp = Math.floor(new Date(candles[0].timestamp).valueOf() / 1000)
    if (!Number.isSafeInteger(oldestTimestamp) || oldestTimestamp <= 0) return
    loadingOlderRef.current = true
    try {
      const result = await workerApi.assetCandles(mint, range, undefined, oldestTimestamp)
      const older = assetCandlesFrom(result.data)
      if (!older.length) { setCanLoadEarlier(false); return }
      setOlderCandles((current: any[]) => {
        const existing = new Set([...current, ...baseCandles].map((candle) => candle.timestamp))
        const additions = older.filter((candle: any) => !existing.has(candle.timestamp))
        if (!additions.length) setCanLoadEarlier(false)
        return [...current, ...additions]
      })
    } catch {
      setCanLoadEarlier(false)
    } finally {
      loadingOlderRef.current = false
    }
  }
  const explorerUrl = solanaExplorerUrl('address', asset?.mint)
  const metrics = asset && [
    asset.priceUsd != null && <MetricCard key="price" label="Price" value={currency(asset.priceUsd)} />,
    asset.marketCapUsd != null && <MetricCard key="cap" label="Market cap" value={currency(asset.marketCapUsd, 2)} />,
    asset.circulatingSupply != null && <MetricCard key="supply" label="Circulating supply" value={quantity(asset.circulatingSupply)} detail="Reported supply" />,
    asset.fullyDilutedValuationUsd != null && <MetricCard key="fdv" label="Fully diluted valuation" value={currency(asset.fullyDilutedValuationUsd)} />,
    asset.liquidityUsd != null && <MetricCard key="liq" label="Liquidity" value={currency(asset.liquidityUsd)} />,
    asset.quality?.organicScore != null && <MetricCard key="quality" label="Organic score" value={String(asset.quality.organicScore)} detail={asset.quality.organicScoreLabel || 'Worker quality signal'} />,
  ].filter(Boolean)
  const activity = asset?.activity
  const auditIndicators = Object.entries(asset?.quality?.audit || {}).filter(([, value]) => value === true).map(([key]) => key)
  return <div className="iris-shell"><Navbar /><DataStatus meta={result.meta || candlesResult.meta} error={result.error || candlesResult.error} />
    {result.loading || candlesResult.loading ? <main className="iris-loading">Loading asset data...</main> : result.error ? <main className="iris-loading">Asset data is currently unavailable from the Worker.</main> : !asset ? <main className="iris-loading">No asset was returned for {mint}.</main> : <main className="iris-page">
      <section className="iris-asset-heading"><div className="iris-asset-identity"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><div><p className="iris-eyebrow">Solana asset</p><h1>{asset.name} <span>{asset.symbol}</span></h1>{explorerUrl && <a href={explorerUrl} target="_blank" rel="noopener noreferrer" title={asset.mint}>{asset.mint}</a>}</div></div>{asset.change24hPct != null && <Change value={asset.change24hPct} />}</section>
      {metrics.length > 0 && <section className="iris-metrics">{metrics}</section>}
        {auditIndicators.length > 0 && <p className="iris-disclosure"><strong>Audit indicators:</strong> {auditIndicators.join(', ')}. This is metadata, not a safety assessment or guarantee.</p>}
        {(activity?.buyVolume24hUsd != null || activity?.sellVolume24hUsd != null || activity?.volume24hUsd != null) && <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Trading activity</p><h2>24H activity</h2></div></div><div className="iris-metrics iris-panel-metrics">{activity.buyVolume24hUsd != null && <MetricCard label="Buy volume" value={currency(activity.buyVolume24hUsd)} />}{activity.sellVolume24hUsd != null && <MetricCard label="Sell volume" value={currency(activity.sellVolume24hUsd)} />}{activity.volume24hUsd != null && <MetricCard label="Total volume" value={currency(activity.volume24hUsd)} />}</div></section>}
        <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price and volume</p><h2>{asset.symbol} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[['1h', '1H'], ['4h', '4H'], ['1d', '1D'], ['7d', '7D']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{label}</button>)}</div></div>{candles.length ? <CandlestickChart candles={candles} canLoadEarlier={canLoadEarlier} onLoadEarlier={loadEarlierCandles} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No price history is available.</p>}</section>
    </main>}
  </div>
}

function Change({ value }: { value: number }) { const positive = value >= 0; return <span className={`iris-change ${positive ? 'iris-positive' : 'iris-negative'}`}>{positive ? '+' : ''}{value.toFixed(2)}% 24H</span> }
