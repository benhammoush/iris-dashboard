import { useEffect, useRef } from 'react'

type Network = { fetchedAt?: string | null; [key: string]: any }
type Transaction = { signature?: string | null; slot?: number | null; blockTime?: string | null; action?: string | null }

const number = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US')
const shortSignature = (value: string) => `${value.slice(0, 8)}...${value.slice(-8)}`
const actionLabel = (value: string | null | undefined) => value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unknown'

function relativeTime(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—'
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="iris-helius-field"><span>{label}</span><strong>{value}</strong></div>
}

export default function HeliusNetworkCard({ network, loading, error, transactions, transactionsLoading, transactionsError }: { network: Network | null; loading: boolean; error: unknown; transactions: Transaction[]; transactionsLoading: boolean; transactionsError: unknown }) {
  const previousSignatures = useRef<Set<string> | null>(null)
  const signatures = new Set(transactions.flatMap((transaction) => typeof transaction.signature === 'string' ? [transaction.signature] : []))
  const newSignatures = previousSignatures.current === null ? new Set<string>() : new Set([...signatures].filter((signature) => !previousSignatures.current?.has(signature)))
  useEffect(() => { previousSignatures.current = signatures }, [transactions])
  const value = network || {}
  const chain = value.chain || { state: 'unavailable' }
  return <section className="iris-helius-card" aria-label="Helius Solana network and recent transactions">
    <div className="iris-helius-topline"><img className="iris-helius-logo" src="/helius-dark.svg" alt="Helius" /><span>Network</span></div>
    <div className="iris-helius-grid">
      <section className="iris-helius-column" aria-label="Solana network status">
        <div className="iris-helius-column-heading"><h3>Solana network</h3></div>
        {loading && !network ? <div className="iris-inline-skeleton iris-helius-loading" aria-label="Loading network snapshot" aria-busy="true"><span /><span /><span /><span /></div> : Boolean(error) && !network ? <p className="iris-helius-loading">Network snapshot unavailable.</p> : <div className="iris-helius-summary"><Field label="Processed slot" value={number(chain.processedSlot)} /><Field label="Confirmed slot" value={number(chain.confirmedSlot)} /><Field label="Block height" value={number(chain.blockHeight)} /><Field label="Epoch" value={number(chain.epoch)} /></div>}
      </section>
      <section className="iris-helius-column iris-helius-transactions" aria-label="Recent Solana transactions">
        <div className="iris-helius-column-heading"><h3>Recent Solana transactions</h3></div>
        {transactionsLoading && !transactions.length && <div className="iris-inline-skeleton iris-helius-loading" aria-label="Loading sampled transactions" aria-busy="true"><span /><span /><span /></div>}
        {Boolean(transactionsError) && !transactions.length && <p className="iris-helius-loading">Recent transactions are unavailable.</p>}
        {!transactionsLoading && !transactionsError && !transactions.length && <p className="iris-helius-loading">No recent transaction sample is available.</p>}
        {transactions.length > 0 && <div className="iris-recent-transaction-list" role="table" aria-label="Latest sampled Solana transactions"><div className="iris-recent-transaction-head" role="row"><span role="columnheader">Signature</span><span role="columnheader">Time</span><span role="columnheader">Block</span><span role="columnheader">Action</span></div>{transactions.map((transaction) => {
          const signature = transaction.signature || ''
          return <div className={`iris-recent-transaction-row${newSignatures.has(signature) ? ' is-new' : ''}`} key={signature} role="row"><a href={`https://explorer.solana.com/tx/${encodeURIComponent(signature)}`} target="_blank" rel="noreferrer" role="cell">{shortSignature(signature)}</a><time dateTime={transaction.blockTime || undefined} title={transaction.blockTime ? new Date(transaction.blockTime).toLocaleString() : undefined} role="cell">{relativeTime(transaction.blockTime)}</time><span role="cell">{number(transaction.slot)}</span><strong role="cell">{actionLabel(transaction.action)}</strong></div>
        })}</div>}
      </section>
    </div>
  </section>
}
