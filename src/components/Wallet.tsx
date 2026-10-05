import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { transactionsFrom, walletFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'

type Holding = { symbol?: string; mint?: string; imageUrl?: string; price?: number; value?: number; displayBalance?: string; balance?: number; rawBalance?: number }
type Activity = { id?: string; timestamp?: string; type?: string; source?: string; status?: string; description?: string; transfers?: Array<{ symbol?: string; mint?: string; amount?: string | number; decimals?: number; kind?: 'native' | 'token' }> }
const currency = (value: number | undefined | null) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
const balance = (asset: Holding) => asset.displayBalance || Number(asset.balance ?? asset.rawBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 8 })
const dateTime = (value: string | undefined) => { const date = value && new Date(value); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-US') : value || '-' }
const transferSummary = (activity: Activity) => !activity.transfers?.length ? 'Transfer details unavailable' : activity.transfers.map((transfer) => `${transfer.kind === 'native' ? 'Native SOL' : `${transfer.symbol || 'Token'} (${transfer.mint || 'mint unavailable'})`}: ${transfer.amount ?? '?'} atomic units (decimals: ${transfer.decimals ?? '?'})`).join(', ')
const activitySummary = (activity: Activity) => [activity.source || 'Provider unavailable', activity.status, activity.description].filter(Boolean).join(' - ')
const holdingsColumns: VirtualTableColumn<Holding>[] = [
  { id: 'asset', label: 'Asset', width: 190, value: (asset) => asset.symbol || '', cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><strong>{asset.symbol || 'Unknown asset'}</strong></span> },
  { id: 'price', label: 'Price', width: 130, align: 'right', value: (asset) => asset.price || 0, cell: (asset) => currency(asset.price) },
  { id: 'balance', label: 'Balance', width: 160, align: 'right', value: balance, cell: balance },
  { id: 'value', label: 'Value', width: 150, align: 'right', value: (asset) => asset.value || 0, cell: (asset) => currency(asset.value) },
]
const activityColumns: VirtualTableColumn<Activity>[] = [
  { id: 'date', label: 'Date', width: 180, value: (activity) => activity.timestamp || '', cell: (activity) => dateTime(activity.timestamp) },
  { id: 'activity', label: 'Provider summary', width: 280, value: activitySummary, cell: activitySummary },
  { id: 'transfers', label: 'Transfers', width: 300, value: transferSummary, cell: transferSummary },
  { id: 'transaction', label: 'Transaction', width: 200, value: (activity) => activity.id || '', cell: (activity) => { const url = solanaExplorerUrl('tx', activity.id); return url ? <a href={url} target="_blank" rel="noopener noreferrer" title={activity.id}>{activity.id}</a> : <span>-</span> } },
]

export default function Wallet() {
  const { address = '' } = useParams(); const navigate = useNavigate()
  const summary = useWorkerResource((options: any) => workerApi.wallet(address, options), [address]) as any
  const firstPage = useWorkerResource((options: any) => workerApi.walletTransactions(address, options), [address]) as any
  const [extraPages, setExtraPages] = useState<Activity[]>([]); const [cursor, setCursor] = useState<string | null>(null); const [loadingMore, setLoadingMore] = useState(false)
  const wallet = walletFrom(summary.data) as any
  const firstTransactions = transactionsFrom(firstPage.data) as Activity[]
  const nextCursor = firstPage.data?.nextCursor ?? firstPage.data?.pageInfo?.nextCursor ?? cursor
  const transactions = [...firstTransactions, ...extraPages]
  const explorerUrl = solanaExplorerUrl('address', wallet?.address)
  const invalidAddress = summary.error?.code === 'INVALID_WALLET_ADDRESS' || summary.error?.status === 400
  async function loadMore() { if (!nextCursor || loadingMore) return; setLoadingMore(true); try { const page = await workerApi.walletTransactions(address, { cursor: nextCursor }); setExtraPages((items) => [...items, ...transactionsFrom(page.data)]); setCursor(page.data?.nextCursor ?? page.data?.pageInfo?.nextCursor ?? null) } finally { setLoadingMore(false) } }
  const valuation = wallet?.valuation || {}; const holdingCount = valuation.holdingCount; const pricedHoldingCount = valuation.pricedHoldingCount; const unpricedHoldingCount = valuation.unpricedHoldingCount
  return <div className="iris-shell"><Navbar /><DataStatus meta={summary.meta || firstPage.meta} error={summary.error || firstPage.error} onRetry={() => { summary.refetch(); firstPage.refetch() }} refreshing={summary.refreshing || firstPage.refreshing} />
    {summary.loading || firstPage.loading ? <main className="iris-loading">Loading public wallet...</main> : invalidAddress ? <Unavailable address={address} text="This is not a valid Solana wallet address." /> : summary.error ? <Unavailable address={address} text="Wallet data is currently unavailable from the Worker." /> : !wallet ? <Unavailable address={address} text="No wallet data was returned." /> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Public wallet</p><h1>{wallet.label || address}</h1>{wallet.description && <p>{wallet.description}</p>}{explorerUrl ? <a className="iris-wallet-address" href={explorerUrl} target="_blank" rel="noopener noreferrer">{wallet.address}</a> : <p className="iris-wallet-address">{address}</p>}</div></section>
      <p className="iris-disclosure">Public on-chain data only. Valuations can be partial when balances are not priced.</p>
      {wallet.truncated && <p className="iris-disclosure">The Worker truncated this wallet's returned balances; the displayed holdings are incomplete.</p>}
      <section className="iris-metrics">{wallet.totalValue != null && <MetricCard label="Priced subtotal" value={currency(wallet.totalValue)} detail={valuation.complete ? 'All returned holdings are priced' : 'Subtotal excludes unpriced holdings'} />}{holdingCount != null && pricedHoldingCount != null && <MetricCard label="Valuation coverage" value={`${pricedHoldingCount} / ${holdingCount}`} detail={unpricedHoldingCount != null ? `${unpricedHoldingCount} holdings are unpriced` : 'Priced holdings / returned holdings'} />}{wallet.assets?.length != null && <MetricCard label="Reported balances" value={wallet.assets.length.toLocaleString()} detail="Balances returned by the Worker" />}</section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Portfolio</p><h2>Holdings</h2></div></div><VirtualTable columns={holdingsColumns} data={wallet.assets || []} emptyLabel="No assets are available for this public wallet." filterPlaceholder="Filter holdings" onRowClick={(asset) => asset.mint && navigate(`/asset/${encodeURIComponent(asset.mint)}`)} /></section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">On-chain activity</p><h2>Transactions</h2></div><span>{transactions.length} events</span></div><VirtualTable columns={activityColumns} data={transactions} emptyLabel="No recent activity is available for this public wallet." filterPlaceholder="Filter activity" />{nextCursor && <div className="iris-load-more"><button className="iris-retry" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more'}</button></div>}</section>
    </main>}
  </div>
}
function Unavailable({ address, text }: { address: string; text: string }) { return <main className="iris-loading"><div><p>{text}</p><p className="iris-wallet-address">{address}</p></div></main> }
