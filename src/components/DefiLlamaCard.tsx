type Dex = { name: string; slug: string | null; total24hUsd: number | null; total7dUsd: number | null; change1dPct: number | null }
type Protocol = { name: string; slug: string | null; category: string | null; solanaTvlUsd: number | null; change1dPct: number | null; change7dPct: number | null }
type Dashboard = { dexes: { total24hUsd: number | null; total7dUsd: number | null; items: Dex[] }; protocols: { total: number | null; items: Protocol[] } }

const currency = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value)
const count = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US')

function Change({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) return <span className="iris-muted">—</span>
  return <span className={value >= 0 ? 'iris-positive' : 'iris-negative'}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>
}

function DefiLlamaLink({ slug, children }: { slug: string | null; children: React.ReactNode }) {
  return slug ? <a href={`https://defillama.com/protocol/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer">{children}</a> : <span>{children}</span>
}

export default function DefiLlamaCard({ dashboard, loading, error }: { dashboard: Dashboard | null; loading: boolean; error: unknown }) {
  return <section className="iris-defillama-card" aria-label="DefiLlama Solana dashboard">
    <div className="iris-defillama-topline"><div><p>DefiLlama</p><h2>Solana DeFi</h2></div><a href="https://defillama.com" target="_blank" rel="noreferrer">View on DefiLlama</a></div>
    {loading && !dashboard && <p className="iris-defillama-state">Loading DeFi metrics...</p>}
    {Boolean(error) && !dashboard && <p className="iris-defillama-state">DeFi metrics are unavailable.</p>}
    {!loading && !error && !dashboard && <p className="iris-defillama-state">No DeFi metrics are available.</p>}
    {dashboard && <div className="iris-catalog-lists iris-defillama-lists">
      <section className="iris-section iris-catalog-list iris-catalog-list--volume" aria-labelledby="iris-defillama-dexes"><div className="iris-catalog-list-heading"><span aria-hidden="true" /><div><h2 id="iris-defillama-dexes">Top DEXes</h2><small>24H {currency(dashboard.dexes.total24hUsd)} · 7D {currency(dashboard.dexes.total7dUsd)}</small></div></div>{dashboard.dexes.items.length ? <div className="iris-catalog-list-rows">{dashboard.dexes.items.map((dex, index) => <DefiLlamaLink key={`${dex.slug || dex.name}-${index}`} slug={dex.slug}><span className="iris-defillama-rank">{index + 1}</span><span className="iris-catalog-list-identity"><strong>{dex.name}</strong><small>24H {currency(dex.total24hUsd)} · 7D {currency(dex.total7dUsd)}</small></span><span className="iris-catalog-list-price"><Change value={dex.change1dPct} /></span></DefiLlamaLink>)}</div> : <p className="iris-empty">No DEX data is available.</p>}</section>
      <section className="iris-section iris-catalog-list iris-catalog-list--trending" aria-labelledby="iris-defillama-protocols"><div className="iris-catalog-list-heading"><span aria-hidden="true" /><div><h2 id="iris-defillama-protocols">Top protocols</h2><small>{count(dashboard.protocols.total)} tracked on Solana</small></div></div>{dashboard.protocols.items.length ? <div className="iris-catalog-list-rows">{dashboard.protocols.items.map((protocol, index) => <DefiLlamaLink key={`${protocol.slug || protocol.name}-${index}`} slug={protocol.slug}><span className="iris-defillama-rank">{index + 1}</span><span className="iris-catalog-list-identity"><strong>{protocol.name}</strong><small>{protocol.category || 'Protocol'} · TVL {currency(protocol.solanaTvlUsd)}</small></span><span className="iris-catalog-list-price iris-defillama-changes"><Change value={protocol.change1dPct} /><Change value={protocol.change7dPct} /></span></DefiLlamaLink>)}</div> : <p className="iris-empty">No protocol data is available.</p>}</section>
    </div>}
  </section>
}
