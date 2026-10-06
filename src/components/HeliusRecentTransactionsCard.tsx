import { solanaExplorerUrl } from '../data/solana'

type Transaction = { signature?: string | null; slot?: number | null; blockTime?: string | null; status?: string | null }

function time(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Time unavailable'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function HeliusRecentTransactionsCard({ transactions, loading, error, meta }: { transactions: Transaction[]; loading: boolean; error: unknown; meta: any }) {
  const freshness = meta?.recentTransactions?.freshness
  const state = freshness === 'stale' ? 'STALE' : freshness === 'fresh' ? 'SAMPLED' : 'UNAVAILABLE'
  return <section className="iris-helius-card iris-recent-transactions" aria-label="Recent Solana transactions">
    <div className="iris-helius-topline"><span className="iris-helius-mark" aria-hidden="true">H</span><div><p>Helius</p><h2>Recent Solana transactions</h2></div><span>{state}</span></div>
    {loading && !transactions.length && <p className="iris-helius-loading">Loading sampled transactions...</p>}
    {Boolean(error) && !transactions.length && <p className="iris-helius-loading">Recent transactions are unavailable.</p>}
    {!loading && !error && !transactions.length && <p className="iris-helius-loading">No recent transaction sample is available.</p>}
    {transactions.length > 0 && <div className="iris-recent-transaction-list">{transactions.map((transaction) => {
      const signature = transaction.signature || ''
      const href = solanaExplorerUrl('tx', signature)
      return <div className="iris-recent-transaction-row" key={signature}>
        <div>{href ? <a href={href} target="_blank" rel="noreferrer">{signature.slice(0, 8)}...{signature.slice(-8)}</a> : <strong>Signature unavailable</strong>}<span>Slot {transaction.slot?.toLocaleString() || '—'}</span></div>
        <div><strong>{transaction.status || 'confirmed'}</strong><span>{time(transaction.blockTime)}</span></div>
      </div>
    })}</div>}
  </section>
}
