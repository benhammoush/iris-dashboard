import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { transactionsFrom, walletFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { VirtualTable, type VirtualTableColumn } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'
import ValueSkeleton from './ValueSkeleton'

type Holding = { symbol?: string; name?: string; mint?: string; imageUrl?: string; price?: number | null; value?: number | null; displayBalance?: string; atomicAmount?: string; balance?: number; rawBalance?: number }
type Activity = { id?: string; timestamp?: string; type?: string; source?: string; status?: string; description?: string; transfers?: Array<{ symbol?: string; mint?: string; amount?: string | number; decimals?: number; kind?: 'native' | 'token' }> }
const currency = (value: number | undefined | null) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
const balance = (asset: Holding) => asset.displayBalance || Number(asset.balance ?? asset.rawBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 8 })
const dateTime = (value: string | undefined) => { const date = value && new Date(value); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-US') : value || '-' }
const transferSummary = (activity: Activity) => !activity.transfers?.length ? 'Transfer details unavailable' : activity.transfers.map((transfer) => `${transfer.kind === 'native' ? 'Native SOL' : `${transfer.symbol || 'Token'} (${transfer.mint || 'mint unavailable'})`}: ${transfer.amount ?? '?'} atomic units (decimals: ${transfer.decimals ?? '?'})`).join(', ')
const activitySummary = (activity: Activity) => [activity.type || 'Activity', activity.description].filter(Boolean).join(' - ')
const transferLabel = (transfer: NonNullable<Activity['transfers']>[number]) => transfer.kind === 'native' ? 'Native SOL' : transfer.symbol || 'Token'
const activityKey = (activity: Activity) => activity.id || `${activity.timestamp || ''}:${activity.type || ''}:${transferSummary(activity)}`
const holdingsColumns: VirtualTableColumn<Holding>[] = [
  { id: 'asset', label: 'Asset', width: 240, value: (asset) => `${asset.symbol || ''} ${asset.name || ''}`, cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><strong>{asset.symbol || 'Unknown asset'}</strong><small>{asset.name && asset.name !== asset.symbol ? asset.name : asset.mint || 'Mint unavailable'}</small></span> },
  { id: 'price', label: 'Price', width: 130, align: 'right', value: (asset) => asset.price || 0, cell: (asset) => currency(asset.price) },
  { id: 'balance', label: 'Balance', width: 160, align: 'right', value: balance, cell: balance },
  { id: 'value', label: 'Value', width: 150, align: 'right', value: (asset) => asset.value || 0, cell: (asset) => currency(asset.value) },
  { id: 'valuation', label: 'Valuation', width: 105, value: (asset) => asset.value == null ? 'Unpriced' : 'Priced', cell: (asset) => <span className={`iris-valuation-status${asset.value == null ? ' iris-valuation-status--unpriced' : ''}`}>{asset.value == null ? 'Unpriced' : 'Priced'}</span> },
]
const activityColumns: VirtualTableColumn<Activity>[] = [
  { id: 'date', label: 'Date', width: 175, value: (activity) => activity.timestamp || '', cell: (activity) => dateTime(activity.timestamp) },
  { id: 'activity', label: 'Activity', width: 250, value: activitySummary, cell: (activity) => <span className="iris-activity-summary"><strong>{activity.type || 'Activity'}</strong>{activity.description && <small>{activity.description}</small>}</span> },
  { id: 'transfers', label: 'Transfers', width: 370, value: transferSummary, cell: (activity) => !activity.transfers?.length ? <span className="iris-muted">Transfer details unavailable</span> : <span className="iris-transfer-list">{activity.transfers.map((transfer, index) => <span key={`${transfer.mint || transfer.symbol || transfer.kind || 'transfer'}:${index}`}><strong>{transferLabel(transfer)}</strong><small>{transfer.amount ?? '?'} atomic units · decimals: {transfer.decimals ?? '?'}</small></span>)}</span> },
  { id: 'status', label: 'Source', width: 130, value: (activity) => [activity.source, activity.status].filter(Boolean).join(' '), cell: (activity) => <span className="iris-activity-status">{activity.source || 'Provider unavailable'}{activity.status && <small>{activity.status}</small>}</span> },
  { id: 'transaction', label: 'Transaction', width: 200, value: (activity) => activity.id || '', cell: (activity) => { const url = solanaExplorerUrl('tx', activity.id); return url ? <a href={url} target="_blank" rel="noopener noreferrer" title={activity.id}>{activity.id}</a> : <span>-</span> } },
]

export default function Wallet() {
  const { address = '' } = useParams(); const navigate = useNavigate()
  const summary = useWorkerResource((options: any) => workerApi.wallet(address, options), [address]) as any
  const firstPage = useWorkerResource((options: any) => workerApi.walletTransactions(address, options), [address]) as any
  const [extraPages, setExtraPages] = useState<Activity[]>([]); const [cursor, setCursor] = useState<string | null>(null); const [loadingMore, setLoadingMore] = useState(false); const [loadMoreError, setLoadMoreError] = useState<unknown>(null)
  const wallet = walletFrom(summary.data) as any
  const firstTransactions = transactionsFrom(firstPage.data) as Activity[]
  const nextCursor = firstPage.data?.nextCursor ?? firstPage.data?.pageInfo?.nextCursor ?? cursor
  const transactions = [...firstTransactions, ...extraPages].filter((activity, index, items) => items.findIndex((candidate) => activityKey(candidate) === activityKey(activity)) === index)
  const explorerUrl = solanaExplorerUrl('address', wallet?.address)
  const invalidAddress = summary.error?.code === 'INVALID_WALLET_ADDRESS' || summary.error?.status === 400
  useEffect(() => { setExtraPages([]); setCursor(null); setLoadingMore(false); setLoadMoreError(null) }, [address])
  async function loadMore() { if (!nextCursor || loadingMore) return; setLoadingMore(true); setLoadMoreError(null); try { const page = await workerApi.walletTransactions(address, { cursor: nextCursor }); setExtraPages((items) => [...items, ...transactionsFrom(page.data)]); setCursor(page.data?.nextCursor ?? page.data?.pageInfo?.nextCursor ?? null) } catch (error) { setLoadMoreError(error) } finally { setLoadingMore(false) } }
  const valuation = wallet?.valuation || {}; const holdingCount = valuation.holdingCount; const pricedHoldingCount = valuation.pricedHoldingCount; const unpricedHoldingCount = valuation.unpricedHoldingCount
  return <div className="iris-shell"><Navbar /><DataStatus meta={summary.meta || firstPage.meta} error={summary.error || firstPage.error} />
    {invalidAddress ? <Unavailable address={address} text="This is not a valid Solana wallet address." /> : summary.error && !wallet ? <Unavailable address={address} text="Wallet data is currently unavailable from the Worker." /> : !summary.loading && !wallet ? <Unavailable address={address} text="No wallet data was returned." /> : <main className="iris-page">
      <section className="iris-wallet-hero" aria-busy={summary.loading && !wallet || undefined}><div className="iris-wallet-hero-heading"><p className="iris-eyebrow">Public wallet</p><h1>{summary.loading && !wallet ? <ValueSkeleton width="300px" /> : wallet?.label || address}</h1>{summary.loading && !wallet ? <p><ValueSkeleton width="390px" /></p> : wallet?.description && <p>{wallet.description}</p>}{summary.loading && !wallet ? <p className="iris-wallet-address"><ValueSkeleton width="280px" /></p> : explorerUrl ? <a className="iris-wallet-address" href={explorerUrl} target="_blank" rel="noopener noreferrer">{wallet?.address}</a> : <p className="iris-wallet-address">{address}</p>}</div><div className="iris-wallet-primary-value"><span>Priced subtotal</span><strong>{summary.loading && !wallet ? <ValueSkeleton width="150px" /> : currency(wallet?.totalValue)}</strong><small>{summary.loading && !wallet ? <ValueSkeleton width="180px" /> : valuation.complete ? 'All returned holdings are priced' : 'Subtotal excludes unpriced holdings'}</small></div><div className="iris-wallet-hero-metrics"><div><span>Valuation coverage</span><strong>{summary.loading && !wallet ? <ValueSkeleton width="54px" /> : holdingCount != null && pricedHoldingCount != null ? `${pricedHoldingCount} / ${holdingCount}` : '—'}</strong><small>{summary.loading && !wallet ? <ValueSkeleton width="100px" /> : unpricedHoldingCount != null ? `${unpricedHoldingCount} unpriced holding${unpricedHoldingCount === 1 ? '' : 's'}` : 'Priced returned holdings'}</small></div><div><span>Reported balances</span><strong>{summary.loading && !wallet ? <ValueSkeleton width="42px" /> : wallet?.assets?.length?.toLocaleString() || '—'}</strong><small>Balances returned by the Worker</small></div></div></section>
      <div className="iris-wallet-disclosures"><p className="iris-disclosure">Public on-chain data only. Valuations can be partial when balances are not priced.</p>{wallet?.truncated && <p className="iris-disclosure iris-disclosure--warning">The Worker truncated this wallet's returned balances; the displayed holdings are incomplete.</p>}</div>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Portfolio</p><h2>Holdings</h2></div></div><VirtualTable columns={holdingsColumns} data={wallet?.assets || []} loading={summary.loading && !wallet} emptyLabel="No assets are available for this public wallet." filterPlaceholder="Filter holdings" onRowClick={(asset) => asset.mint && navigate(`/asset/${encodeURIComponent(asset.mint)}`)} /></section>
      <section className="iris-section iris-wallet-activity"><div className="iris-helius-topline"><img className="iris-helius-logo" src="/helius-dark.svg" alt="Helius" /><span>Decoded activity</span></div><div className="iris-panel-heading"><div><p className="iris-eyebrow">On-chain activity</p><h2>Transactions</h2></div><span>{firstPage.loading && !transactions.length ? <ValueSkeleton width="48px" /> : `${transactions.length} events`}</span></div>{firstPage.error && !transactions.length ? <div className="iris-wallet-error"><p>Helius transaction history is unavailable.</p><button className="iris-retry" onClick={firstPage.refetch}>Retry activity</button></div> : <><VirtualTable columns={activityColumns} data={transactions} loading={firstPage.loading && !transactions.length} emptyLabel="No recent activity is available for this public wallet." filterPlaceholder="Filter activity" rowHeight={76} />{loadMoreError && <div className="iris-wallet-pagination-error"><span>Could not load more transactions.</span><button className="iris-retry" onClick={loadMore}>Retry</button></div>}{nextCursor && <div className="iris-load-more"><button className="iris-retry" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more'}</button></div>}</>}</section>
    </main>}
  </div>
}
function Unavailable({ address, text }: { address: string; text: string }) { return <main className="iris-loading"><div><p>{text}</p><p className="iris-wallet-address">{address}</p></div></main> }
