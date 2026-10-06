type Network = { fetchedAt?: string | null; [key: string]: any }
type Transaction = { signature?: string | null; slot?: number | null; blockTime?: string | null; status?: string | null }

const number = (value: unknown, digits = 0) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })
const shortSignature = (value: string) => `${value.slice(0, 8)}...${value.slice(-8)}`
const transactionTime = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Time unavailable'

function Field({ label, value }: { label: string; value: string }) {
  return <div className="iris-helius-field"><span>{label}</span><strong>{value}</strong></div>
}

export default function HeliusNetworkCard({ network, loading, error, transactions, transactionsLoading, transactionsError, transactionsMeta }: { network: Network | null; loading: boolean; error: unknown; transactions: Transaction[]; transactionsLoading: boolean; transactionsError: unknown; transactionsMeta: any }) {
  const value = network || {}
  const chain = value.chain || { state: 'unavailable' }
  const freshness = transactionsMeta?.recentTransactions?.freshness
  const transactionState = freshness === 'stale' ? 'STALE' : freshness === 'fresh' ? 'SAMPLED' : 'UNAVAILABLE'
  return <section className="iris-helius-card" aria-label="Helius Solana network and recent transactions">
    <CardHeader live={chain.state === 'fresh' && freshness === 'fresh'} />
    <div className="iris-helius-grid">
      <section className="iris-helius-column" aria-label="Solana network status">
        <div className="iris-helius-column-heading"><h3>Solana network</h3><span>{chain.state === 'fresh' ? 'LIVE' : 'SNAPSHOT'}</span></div>
        {loading && !network ? <p className="iris-helius-loading">Loading network snapshot...</p> : Boolean(error) && !network ? <p className="iris-helius-loading">Network snapshot unavailable.</p> : <div className="iris-helius-summary">
          <Field label="Processed slot" value={number(chain.processedSlot)} />
          <Field label="Confirmed slot" value={number(chain.confirmedSlot)} />
          <Field label="Block height" value={number(chain.blockHeight)} />
          <Field label="Epoch" value={number(chain.epoch)} />
        </div>}
      </section>
      <section className="iris-helius-column iris-helius-transactions" aria-label="Recent Solana transactions">
        <div className="iris-helius-column-heading"><h3>Recent Solana transactions</h3><span>{transactionState}</span></div>
        {transactionsLoading && !transactions.length && <p className="iris-helius-loading">Loading sampled transactions...</p>}
        {Boolean(transactionsError) && !transactions.length && <p className="iris-helius-loading">Recent transactions are unavailable.</p>}
        {!transactionsLoading && !transactionsError && !transactions.length && <p className="iris-helius-loading">No recent transaction sample is available.</p>}
        {transactions.length > 0 && <div className="iris-recent-transaction-list">{transactions.map((transaction) => {
          const signature = transaction.signature || ''
          return <div className="iris-recent-transaction-row" key={signature}>
            <div><a href={`https://explorer.solana.com/tx/${encodeURIComponent(signature)}`} target="_blank" rel="noreferrer">{shortSignature(signature)}</a><span>Slot {transaction.slot?.toLocaleString() || '—'}</span></div>
            <div><strong>{transaction.status || 'confirmed'}</strong><span>{transactionTime(transaction.blockTime)}</span></div>
          </div>
        })}</div>}
      </section>
    </div>
  </section>
}

function CardHeader({ live }: { live: boolean }) {
  return <div className="iris-helius-topline"><HeliusLogo /><div><p>Helius</p><h2>Network and transactions</h2></div><span>{live ? 'LIVE' : 'SNAPSHOT'}</span></div>
}

function HeliusLogo() {
  return <svg className="iris-helius-mark" aria-label="Helius" viewBox="0 0 40 40" role="img"><defs><clipPath id="helius-logo-a"><path d="M0 0h40v40H0z" /></clipPath><linearGradient id="helius-logo-b" x1="15" y1="0" x2="25" y2="9" gradientUnits="userSpaceOnUse"><stop stopColor="#ffb143" /><stop offset="1" stopColor="#e84125" /></linearGradient><linearGradient id="helius-logo-c" x1="4" y1="8" x2="14" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#ff8a36" /><stop offset="1" stopColor="#e84125" /></linearGradient><linearGradient id="helius-logo-d" x1="0" y1="19" x2="10" y2="29" gradientUnits="userSpaceOnUse"><stop stopColor="#f2532f" /><stop offset="1" stopColor="#ff9d2f" /></linearGradient><linearGradient id="helius-logo-e" x1="10" y1="29" x2="20" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#e84125" /><stop offset="1" stopColor="#ffb143" /></linearGradient><linearGradient id="helius-logo-f" x1="20" y1="29" x2="30" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#ff9d2f" /><stop offset="1" stopColor="#e84125" /></linearGradient><linearGradient id="helius-logo-g" x1="30" y1="18" x2="40" y2="29" gradientUnits="userSpaceOnUse"><stop stopColor="#e84125" /><stop offset="1" stopColor="#ffb143" /></linearGradient><linearGradient id="helius-logo-h" x1="26" y1="8" x2="36" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#ff8a36" /><stop offset="1" stopColor="#e84125" /></linearGradient></defs><g clipPath="url(#helius-logo-a)"><path d="M25.23 8.381a13.053 13.053 0 0 0-5.104-1.03c-1.811 0-3.535.366-5.103 1.03L19.71.241a.477.477 0 0 1 .825 0l4.69 8.14h.004Z" fill="url(#helius-logo-b)" /><path d="M13.776 8.991a13.164 13.164 0 0 0-6.334 8.14L3.957 8.233a.477.477 0 0 1 .514-.647l9.305 1.406Z" fill="url(#helius-logo-c)" /><path d="M9.801 28.614.338 25.686a.479.479 0 0 1-.186-.806l7.03-6.539a13.348 13.348 0 0 0-.176 2.159c0 3.063 1.045 5.881 2.796 8.114Z" fill="url(#helius-logo-d)" /><path d="m19.93 33.648-8.297 5.667a.474.474 0 0 1-.743-.359l-.741-9.923a13.072 13.072 0 0 0 9.781 4.611v.004Z" fill="url(#helius-logo-e)" /><path d="m30.073 29.074-.737 9.872a.479.479 0 0 1-.51.44.477.477 0 0 1-.234-.08l-8.28-5.658a13.068 13.068 0 0 0 9.76-4.574Z" fill="url(#helius-logo-f)" /><path d="m39.907 25.656-9.422 2.914a13.105 13.105 0 0 0 2.761-8.07c0-.745-.064-1.477-.182-2.189l7.026 6.535c.27.251.166.701-.183.807v.003Z" fill="url(#helius-logo-g)" /><path d="m36.294 8.25-3.48 8.896A13.183 13.183 0 0 0 26.5 9.005l9.28-1.403a.477.477 0 0 1 .514.647Z" fill="url(#helius-logo-h)" /></g></svg>
}
