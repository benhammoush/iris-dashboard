import { useNavigate, useParams } from 'react-router-dom'
import { workerApi } from '../api/worker'
import { walletFrom } from '../data/normalizers'
import { useWorkerResource } from '../hooks/useWorkerResource'
import DataStatus from './DataStatus'
import Navbar from './Navbar'
import AssetIcon from './AssetIcon'
import { MetricCard, VirtualTable, type VirtualTableColumn } from '../design-system'
import { solanaExplorerUrl } from '../data/solana'

type Holding = { symbol?: string; mint?: string; imageUrl?: string; price?: number; value?: number; displayBalance?: string; balance?: number; rawBalance?: number }
type Activity = { id?: string; timestamp?: string; type?: string; symbol?: string; amount?: number; value?: number }

const currency = (value: number | undefined | null) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
const balance = (asset: Holding) => asset.displayBalance || Number(asset.balance ?? asset.rawBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 8 })
const dateTime = (value: string | undefined) => { const date = value && new Date(value); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-US') : value || '-' }

const holdingsColumns: VirtualTableColumn<Holding>[] = [
  { id: 'asset', label: 'Asset', width: 190, value: (asset) => asset.symbol || '', cell: (asset) => <span className="iris-asset-cell"><AssetIcon src={asset.imageUrl} symbol={asset.symbol} /><strong>{asset.symbol || 'Unknown asset'}</strong></span> },
  { id: 'price', label: 'Price', width: 130, align: 'right', value: (asset) => asset.price || 0, cell: (asset) => currency(asset.price) },
  { id: 'balance', label: 'Balance', width: 160, align: 'right', value: (asset) => balance(asset), cell: balance },
  { id: 'value', label: 'Value', width: 150, align: 'right', value: (asset) => asset.value || 0, cell: (asset) => currency(asset.value) },
]

const activityColumns: VirtualTableColumn<Activity>[] = [
  { id: 'date', label: 'Date', width: 180, value: (activity) => activity.timestamp || '', cell: (activity) => dateTime(activity.timestamp) },
  { id: 'activity', label: 'Activity', width: 120, value: (activity) => activity.type || '', cell: (activity) => activity.type || 'Activity' },
  { id: 'asset', label: 'Asset', width: 100, value: (activity) => activity.symbol || '', cell: (activity) => activity.symbol || '-' },
  { id: 'amount', label: 'Amount', width: 140, align: 'right', value: (activity) => activity.amount || 0, cell: (activity) => Number(activity.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 8 }) },
  { id: 'value', label: 'Value', width: 130, align: 'right', value: (activity) => activity.value || 0, cell: (activity) => activity.value === undefined ? '-' : currency(activity.value) },
  { id: 'transaction', label: 'Transaction', width: 200, value: (activity) => activity.id || '', cell: (activity) => { const url = solanaExplorerUrl('tx', activity.id); return url ? <a href={url} target="_blank" rel="noopener noreferrer" title={activity.id}>{activity.id}</a> : <span>-</span> } },
]

export default function Wallet() {
  const { address = '' } = useParams()
  const navigate = useNavigate()
  const result = useWorkerResource((options: any) => workerApi.wallet(address, options), [address]) as any
  const wallet = walletFrom(result.data) as any
  const explorerUrl = solanaExplorerUrl('address', wallet?.address)
  const invalidAddress = result.error?.code === 'INVALID_WALLET_ADDRESS' || result.error?.status === 400

  return <div className="iris-shell"><Navbar /><DataStatus meta={result.meta} error={result.error} onRetry={result.refetch} refreshing={result.refreshing} />
    {result.loading ? <main className="iris-loading">Loading public wallet...</main> : invalidAddress ? <Unavailable address={address} text="This is not a valid Solana wallet address." /> : result.error ? <Unavailable address={address} text="Wallet data is currently unavailable from the Worker." /> : !wallet ? <Unavailable address={address} text="No wallet data was returned." /> : <main className="iris-page">
      <section className="iris-page-heading"><div><p className="iris-eyebrow">Public wallet</p><h1>{wallet.label || address}</h1>{wallet.description && <p>{wallet.description}</p>}{explorerUrl ? <a className="iris-wallet-address" href={explorerUrl} target="_blank" rel="noopener noreferrer">{wallet.address}</a> : <p className="iris-wallet-address">{address}</p>}</div><span className="iris-block">On-chain data only</span></section>
      <p className="iris-disclosure">Public on-chain data only. Balances and activity are provided by the Worker, may be delayed or incomplete, and do not require a wallet connection or private information.</p>
      <section className="iris-metrics"><MetricCard label="Portfolio total" value={currency(wallet.totalValue)} detail="Worker valuation at the latest snapshot" /><MetricCard label="Tracked holdings" value={(wallet.assets || []).length.toLocaleString()} detail="Assets with a reported balance" /><MetricCard label="Recent activity" value={(wallet.transactions || []).length.toLocaleString()} detail="Latest public transactions" /></section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">Portfolio</p><h2>Holdings</h2></div></div><VirtualTable columns={holdingsColumns} data={wallet.assets || []} emptyLabel="No assets are available for this public wallet." filterPlaceholder="Filter holdings" onRowClick={(asset) => asset.mint && navigate(`/asset/${encodeURIComponent(asset.mint)}`)} /></section>
      <section className="iris-section"><div className="iris-panel-heading"><div><p className="iris-eyebrow">On-chain activity</p><h2>Recent activity</h2></div><span>{(wallet.transactions || []).length} events</span></div><VirtualTable columns={activityColumns} data={wallet.transactions || []} emptyLabel="No recent activity is available for this public wallet." filterPlaceholder="Filter activity" /></section>
    </main>}
  </div>
}

function Unavailable({ address, text }: { address: string; text: string }) {
  return <main className="iris-loading"><div><p>{text}</p><p className="iris-wallet-address">{address}</p></div></main>
}
