import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetHistoryFrom, assetsFrom, swapsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { AreaChart, MetricCard } from '../design-system'

const currency = (value: number | null | undefined, digits = 5) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`

export default function Asset() {
  const { symbol = '' } = useParams()
  const [rangeDays, setRangeDays] = useState(365)
  const result = useWorkerResource((options: any) => workerApi.asset(symbol, options), [symbol]) as any
  const swaps = useWorkerResource(workerApi.swaps, []) as any
  const assetPayload = result.data?.asset ? [result.data.asset] : Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
  const asset = assetsFrom(assetPayload)[0] as any
  const history = assetHistoryFrom(result.data?.asset || result.data).sort((left: [string, number], right: [string, number]) => new Date(left[0]).valueOf() - new Date(right[0]).valueOf()) as [string, number][]
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - rangeDays)
  const visibleHistory = history.filter(([date]) => rangeDays === 1000 || new Date(date) >= fromDate).map(([date, value]) => ({ date, value: Number(value) }))
  const assetSwaps = swapsFrom(swaps.data).filter((swap: any) => swap.asset?.symbol === asset?.symbol).slice(0, 8)

  return <div className="iris-shell">
    <Navbar />
    <DataStatus meta={result.meta} error={result.error} onRetry={() => { result.refetch(); swaps.refetch(); }} refreshing={result.refreshing || swaps.refreshing} />
    {result.loading ? <main className="iris-loading">Loading asset data...</main> : result.error ? <main className="iris-loading"><div><p>{result.error.code === 'ASSET_NOT_FOUND' ? 'This asset is not in the Worker catalog.' : result.error.code === 'ASSET_SYMBOL_AMBIGUOUS' ? 'This symbol matches multiple contracts. Select the asset from the catalog.' : 'Asset data is currently unavailable from the Worker.'}</p>{result.error.requestId && <p className="iris-wallet-address">Request {result.error.requestId}</p>}<button className="iris-retry" onClick={result.refetch}>Retry</button></div></main> : !asset ? <main className="iris-loading">No asset was returned for {symbol}.</main> : <main className="iris-page">
      <section className="iris-asset-heading"><div className="iris-asset-identity"><AssetIcon src={asset.image_uri} symbol={asset.symbol} /><div><p className="iris-eyebrow">Stacks asset</p><h1>{asset.name} <span>{asset.symbol}</span></h1><p title={asset.contract_principal || asset.asset_identifier}>{asset.contract_principal || asset.asset_identifier || 'No contract identifier available'}</p></div></div><Change value={asset.change_24h} /></section>
      <section className="iris-metrics">
        <MetricCard label="Price" value={currency(asset.price_usd)} detail="Current Worker market price" />
        <MetricCard label="Market cap" value={currency(asset.market_cap_usd, 2)} detail="Market-cap estimate" />
        <MetricCard label="Supply" value={Number(asset.normalized_supply ?? asset.total_supply ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} detail="Reported token supply" />
      </section>
      <section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price history</p><h2>{asset.symbol} / USD</h2></div><div className="iris-range" aria-label="Asset price history range">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className={rangeDays === days ? 'active' : ''} onClick={() => setRangeDays(days as number)}>{label}</button>)}</div></div>{visibleHistory.length ? <AreaChart points={visibleHistory} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No price history available.</p>}</section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">DEX activity</p><h2>Recent {asset.symbol} swaps</h2></div><span>{assetSwaps.length} events</span></div>{assetSwaps.length ? <div className="iris-activity-list">{assetSwaps.map((swap: any, index: number) => <div className="iris-activity-row" key={`${swap.transaction || swap.date}-${index}`}><div><strong>{swap.type || 'SWAP'}</strong><span>{swap.amount === undefined ? 'Transfer details unavailable' : `${Number(swap.amount).toLocaleString('en-US')} ${asset.symbol}`}</span></div><div><strong>{swap.value?.amount === undefined ? 'Details unavailable' : currency(swap.value.amount)}</strong><small>{swap.date || 'Date unavailable'}</small></div></div>)}</div> : <p className="iris-empty">No matching swap activity is available.</p>}</section>
    </main>}
  </div>
}

function Change({ value }: { value?: number | null }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <span className="iris-change iris-muted">24H unavailable</span>
  const change = Number(value)
  return <span className={`iris-change ${change >= 0 ? 'iris-positive' : 'iris-negative'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}% 24H</span>
}
