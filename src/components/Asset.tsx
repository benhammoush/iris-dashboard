import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { assetCandlesFrom, assetDistributionFrom, assetOnchainFrom, assetTransactionsFrom, assetsFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { CandlestickChart, VirtualTable, type VirtualTableColumn } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'
import LoadingSkeleton from './LoadingSkeleton'

const currency = (value: number | null | undefined, digits = 5) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })}`
const compactCurrency = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(Number(value))
const compactQuantity = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(value))
const timeframeGroups: [string, string[]][] = [['Seconds', ['1s', '15s', '30s']], ['Minutes', ['1m', '3m', '5m', '15m', '30m']], ['Hours', ['1H', '2H', '4H', '6H', '8H', '12H']], ['Days+', ['1D', '3D', '1W', '1M']]]
const primaryTimeframes = [['1m', '1m'], ['30m', '30m'], ['1h', '1H'], ['1d', '1D'], ['1mn', '1M']]
type MintTransaction = { signature: string, timestamp: string | null, action: string | null, protocol: string | null, summary: string | null, transfers: Array<{ amount: string, from: string | null, to: string | null }> }
type DistributionAccount = { rank: number, tokenAccount: string, owner: string | null, amount: string, supplyPercent: string | null, frozen: boolean | null }
const dateTime = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-US') : 'Unknown time'
const transferSummary = (transaction: MintTransaction) => transaction.transfers.length ? transaction.transfers.map((transfer) => `${transfer.amount} ${transfer.from ? `from ${short(transfer.from)}` : 'minted'} ${transfer.to ? `to ${short(transfer.to)}` : 'burned'}`).join(', ') : transaction.summary || 'Transfer details unavailable'
const transactionColumns: VirtualTableColumn<MintTransaction>[] = [
  { id: 'time', label: 'Time', width: 210, value: (transaction) => transaction.timestamp || '', cell: (transaction) => dateTime(transaction.timestamp) },
  { id: 'action', label: 'Action', width: 160, value: (transaction) => transaction.action || 'Unknown', cell: (transaction) => transaction.action || 'Unknown' },
  { id: 'transfers', label: 'Transfers', width: 610, value: transferSummary, cell: transferSummary },
  { id: 'protocol', label: 'Protocol', width: 190, value: (transaction) => transaction.protocol || 'On-chain', cell: (transaction) => transaction.protocol || 'On-chain' },
  { id: 'signature', label: 'Signature', width: 210, value: (transaction) => transaction.signature, cell: (transaction) => { const url = solanaExplorerUrl('tx', transaction.signature); return url ? <a href={url} target="_blank" rel="noopener noreferrer" title={transaction.signature}>{short(transaction.signature)}</a> : short(transaction.signature) } },
]
const distributionColumns: VirtualTableColumn<DistributionAccount>[] = [
  { id: 'rank', label: 'Rank', width: 100, value: (account) => account.rank, cell: (account) => `#${account.rank}` },
  { id: 'owner', label: 'Wallet', width: 420, value: (account) => account.owner || account.tokenAccount, cell: (account) => account.owner ? <a href={`/wallet/${encodeURIComponent(account.owner)}`} title={`Open ${account.owner} in Iris`}>{short(account.owner)}</a> : short(account.tokenAccount) },
  { id: 'balance', label: 'Balance', width: 520, value: (account) => account.amount, cell: (account) => account.amount, align: 'right' },
  { id: 'share', label: 'Supply share', width: 330, value: (account) => account.supplyPercent || '', cell: (account) => account.supplyPercent === null ? '—' : `${account.supplyPercent}%`, align: 'right' },
]

export default function Asset() {
  const { mint = '' } = useParams(); const [timeframe, setTimeframe] = useState('1H')
  const [timeframeMenuOpen, setTimeframeMenuOpen] = useState(false)
  const timeframeMenuRef = useRef<HTMLDivElement>(null)
  const [olderCandles, setOlderCandles] = useState<any[]>([])
  const [canLoadEarlier, setCanLoadEarlier] = useState(true)
  const loadingOlderRef = useRef(false)
  const result = useWorkerResource((options: any) => workerApi.asset(mint, options), [mint]) as any
  const candlesResult = useWorkerResource((options: any) => workerApi.assetCandles(mint, timeframe, options), [mint, timeframe]) as any
  const onchainResult = useWorkerResource((options: any) => workerApi.assetOnchain(mint, options), [mint]) as any
  const [intelligenceTab, setIntelligenceTab] = useState<'transactions' | 'distribution'>('transactions')
  const transactionsResult = useWorkerResource((options: any) => intelligenceTab === 'transactions' ? workerApi.assetTransactions(mint, options) : Promise.resolve({ data: null, meta: null }), [mint, intelligenceTab]) as any
  const distributionResult = useWorkerResource((options: any) => intelligenceTab === 'distribution' ? workerApi.assetDistribution(mint, options) : Promise.resolve({ data: null, meta: null }), [mint, intelligenceTab]) as any
  const asset = assetsFrom(result.data?.asset || result.data ? [result.data?.asset || result.data] : [])[0] as any
  const onchain = assetOnchainFrom(onchainResult.data)
  const transactions = assetTransactionsFrom(transactionsResult.data)
  const distribution = assetDistributionFrom(distributionResult.data)
  const baseCandles = assetCandlesFrom(candlesResult.data)
  const candlesByTimestamp = new Map<string, any>()
  for (const candle of [...olderCandles, ...baseCandles]) candlesByTimestamp.set(candle.timestamp, candle)
  const candles = [...candlesByTimestamp.values()].sort((left: any, right: any) => new Date(left.timestamp).valueOf() - new Date(right.timestamp).valueOf())
  useEffect(() => { setOlderCandles([]); setCanLoadEarlier(true); loadingOlderRef.current = false; setIntelligenceTab('transactions') }, [mint, timeframe])
  useEffect(() => {
    const closeMenu = (event: PointerEvent) => { if (!timeframeMenuRef.current?.contains(event.target as Node)) setTimeframeMenuOpen(false) }
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [])
  async function loadEarlierCandles() {
    if (loadingOlderRef.current || !canLoadEarlier || !candles.length) return
    const oldestTimestamp = Math.floor(new Date(candles[0].timestamp).valueOf() / 1000)
    if (!Number.isSafeInteger(oldestTimestamp) || oldestTimestamp <= 0) return
    loadingOlderRef.current = true
    try {
      const result = await workerApi.assetCandles(mint, timeframe, undefined, oldestTimestamp)
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
  const activity = asset?.activity
  const metrics: { label: string, value: string, detail?: string | null }[] = [
    asset?.marketCapUsd != null ? { label: 'Market cap', value: compactCurrency(asset.marketCapUsd) } : null,
    asset?.fullyDilutedValuationUsd != null ? { label: 'Fully diluted valuation', value: compactCurrency(asset.fullyDilutedValuationUsd) } : null,
    asset?.liquidityUsd != null ? { label: 'Liquidity', value: compactCurrency(asset.liquidityUsd) } : null,
    asset?.circulatingSupply != null ? { label: 'Circulating supply', value: compactQuantity(asset.circulatingSupply) } : null,
    activity?.volume24hUsd != null ? { label: '24H volume', value: compactCurrency(activity.volume24hUsd) } : null,
    asset?.quality?.organicScore != null ? { label: 'Organic score', value: Number(asset.quality.organicScore).toLocaleString('en-US', { maximumFractionDigits: 1 }), detail: asset.quality.organicScoreLabel || null } : null,
  ].filter((metric): metric is { label: string, value: string, detail?: string | null } => metric !== null)
  return <div className="iris-shell"><Navbar /><DataStatus meta={result.meta || candlesResult.meta} error={result.error || candlesResult.error} />
    {result.loading || candlesResult.loading ? <LoadingSkeleton page="asset" /> : result.error ? <main className="iris-loading">Asset data is currently unavailable from the Worker.</main> : !asset ? <main className="iris-loading">No asset was returned for {mint}.</main> : <main className="iris-page">
      <section className="iris-asset-intelligence-hero"><div className="iris-asset-heading"><div className="iris-asset-identity"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><div><p className="iris-eyebrow">Solana token intelligence</p><h1>{asset.name} <span>{asset.symbol}</span></h1>{explorerUrl && <a href={explorerUrl} target="_blank" rel="noopener noreferrer" title={asset.mint}>{asset.mint}</a>}</div></div><div className="iris-hero-price"><span>Current price</span><strong>{currency(asset.priceUsd, 2)}</strong>{asset.change24hPct != null && <Change value={asset.change24hPct} />}</div></div>{metrics.length > 0 && <div className="iris-jupiter-market-data" aria-label="Market metrics"><div className="iris-jupiter-metrics">{metrics.map((metric) => <Metric label={metric.label} value={metric.value} detail={metric.detail} key={metric.label} />)}</div></div>}</section>
      <div className="iris-asset-intelligence-grid"><section className="iris-section iris-asset-chart"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Price and volume</p><h2>{asset.symbol} / USD <Source label="Birdeye" /></h2></div><div className="iris-timeframe" aria-label="Candle timeframe">{primaryTimeframes.map(([label, value]) => <button key={value} className={timeframe === value ? 'active' : ''} onClick={() => setTimeframe(value)}>{label}</button>)}<div className="iris-timeframe-menu" ref={timeframeMenuRef}><button className={timeframeMenuOpen ? 'active iris-timeframe-toggle' : 'iris-timeframe-toggle'} onClick={() => setTimeframeMenuOpen((open) => !open)} aria-expanded={timeframeMenuOpen} aria-haspopup="menu" aria-label="Show all candle timeframes">All <span aria-hidden="true">⌄</span></button>{timeframeMenuOpen && <div className="iris-timeframe-popover" role="menu">{timeframeGroups.map(([label, values]) => <div key={label} className="iris-timeframe-group"><p>{label}</p>{values.map((value) => <button key={value} role="menuitem" className={timeframe === value ? 'active' : ''} onClick={() => { setTimeframe(value); setTimeframeMenuOpen(false) }}>{value}</button>)}</div>)}</div>}</div></div></div>{candles.length ? <CandlestickChart candles={candles} canLoadEarlier={canLoadEarlier} onLoadEarlier={loadEarlierCandles} valueFormatter={(value) => currency(value)} /> : <p className="iris-empty">No price history is available.</p>}</section><OnchainPanel onchain={onchain} loading={onchainResult.loading} error={onchainResult.error} /></div>
      <IntelligencePanel tab={intelligenceTab} onTabChange={setIntelligenceTab} transactions={transactions} transactionLoading={transactionsResult.loading} transactionError={transactionsResult.error} distribution={distribution} distributionLoading={distributionResult.loading} distributionError={distributionResult.error} />
    </main>}
  </div>
}

function Change({ value }: { value: number }) { const positive = value >= 0; return <span className={`iris-change ${positive ? 'iris-positive' : 'iris-negative'}`}>{positive ? '+' : ''}{value.toFixed(2)}% 24H</span> }
function Source({ label }: { label: string }) { return <span className="iris-source">{label}</span> }
function Metric({ label, value, detail = null }: { label: string, value: string, detail?: string | null }) { return <section className="iris-jupiter-metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</section> }
function short(value: string | null) { return value ? `${value.slice(0, 5)}...${value.slice(-5)}` : 'None' }
function OnchainPanel({ onchain, loading, error }: any) { return <aside className="iris-onchain-panel"><div className="iris-onchain-panel-heading"><div><p className="iris-eyebrow">Protocol state</p><h2>On-chain profile <Source label="Helius" /></h2></div><span>{loading ? 'Loading' : error ? 'Unavailable' : 'Indexed'}</span></div>{onchain ? <div className="iris-onchain-fields"><Field label="Token program" value={onchain.tokenProgram ? short(onchain.tokenProgram) : 'Unknown'} /><Field label="Interface" value={onchain.interface || 'Unknown'} /><Field label="Total supply" value={onchain.mintState.supply || 'Unknown'} detail={onchain.mintState.supplyAtomic ? 'Atomic value retained by API' : null} /><Field label="Mint authority" value={short(onchain.mintState.mintAuthority)} /><Field label="Freeze authority" value={short(onchain.mintState.freezeAuthority)} /><Field label="Metadata" value={onchain.mintState.isMutable === null ? 'Unknown' : onchain.mintState.isMutable ? 'Mutable' : 'Immutable'} />{onchain.mintState.extensions.length > 0 && <div className="iris-onchain-extension"><span>Token-2022 extensions</span><strong>{onchain.mintState.extensions.join(', ')}</strong></div>}</div> : <p className="iris-empty">{error ? 'Helius on-chain data is unavailable.' : 'Loading on-chain profile.'}</p>}</aside> }
function Field({ label, value, detail = null }: { label: string, value: string, detail?: string | null }) { return <div className="iris-onchain-field"><span>{label}</span><strong title={value}>{value}</strong>{detail && <small>{detail}</small>}</div> }
function IntelligencePanel({ tab, onTabChange, transactions, transactionLoading, transactionError, distribution, distributionLoading, distributionError }: any) { return <section className="iris-section iris-holder-panel iris-onchain-intelligence"><div className="iris-panel-heading"><div><p className="iris-eyebrow">On-chain intelligence</p><h2>Mint history and distribution <Source label="Helius" /></h2></div></div><div className="iris-intelligence-tabs" role="tablist" aria-label="On-chain intelligence"><button role="tab" aria-selected={tab === 'transactions'} className={tab === 'transactions' ? 'active' : ''} onClick={() => onTabChange('transactions')}>Transactions</button><button role="tab" aria-selected={tab === 'distribution'} className={tab === 'distribution' ? 'active' : ''} onClick={() => onTabChange('distribution')}>Largest accounts</button></div>{tab === 'transactions' ? <TransactionList transactions={transactions} loading={transactionLoading} error={transactionError} /> : <DistributionList accounts={distribution} loading={distributionLoading} error={distributionError} />}</section> }
function TransactionList({ transactions, loading, error }: { transactions: MintTransaction[], loading: boolean, error: unknown }) { return loading ? <p className="iris-empty">Loading mint-address history.</p> : error ? <p className="iris-empty">Helius transaction history is unavailable.</p> : <VirtualTable columns={transactionColumns} data={transactions} emptyLabel="No indexed mint-address transactions were returned." filterPlaceholder="Filter mint history" /> }
function DistributionList({ accounts, loading, error }: { accounts: DistributionAccount[], loading: boolean, error: unknown }) { return loading ? <p className="iris-empty">Loading largest token accounts.</p> : error ? <p className="iris-empty">Helius distribution data is unavailable.</p> : <VirtualTable columns={distributionColumns} data={accounts} emptyLabel="No largest token accounts were returned." filterPlaceholder="Filter largest accounts" /> }
