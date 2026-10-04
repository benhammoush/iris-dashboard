import { useParams, useNavigate } from 'react-router-dom';
import { workerApi } from '../api/worker';
import { walletFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';
import DataStatus from './DataStatus';
import Navbar from './Navbar';

function Wallet() {
  const { address } = useParams();
  const navigate = useNavigate();
  const result = useWorkerResource((options) => workerApi.wallet(address, options), [address]);
  const wallet = walletFrom(result.data);
  const assets = wallet?.assets || [];
  const transactions = wallet?.transactions || [];
  const notTracked = result.error?.code === 'NOT_FOUND' || result.error?.code === 'NOT_TRACKED' || result.error?.status === 404;

  return <div className="App bg-background_light font-poppins dark:bg-background_dark"><Navbar />
    <DataStatus meta={result.meta} error={result.error} />
    {result.loading ? <main className="flex h-[70vh] items-center justify-center">Loading tracked wallet...</main> : notTracked ? <Unavailable address={address} text="This address is not tracked. Featured wallets have not been configured." /> : result.error ? <Unavailable address={address} text="Wallet data is currently unavailable from the Worker." /> : !wallet ? <Unavailable address={address} text="This address is not tracked." /> : <main className="mx-auto w-full max-w-5xl p-5">
      <p className="truncate text-lg text-gray-600">{wallet.label || address}</p>{wallet.description && <p className="mt-1 text-sm text-gray-500">{wallet.description}</p>}<p className="mt-4 text-sm text-gray-500">Public on-chain data only. Balances and activity are provided by the Worker, may be delayed or incomplete, and do not require a wallet connection or private information.</p><p className="mt-3 text-sm text-gray-500">Portfolio total</p><p className="text-2xl font-bold">{currency(wallet.totalValue)}</p>
      <section className="mt-8 overflow-x-auto rounded-lg border bg-primary_light shadow-md"><table className="min-w-full"><thead><tr><th className="p-3 text-left">Asset</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Balance</th><th className="p-3 text-right">Value</th></tr></thead><tbody>{assets.map((asset, index) => <tr key={asset.symbol || asset.asset_identifier || index} className={asset.symbol ? 'cursor-pointer border-t hover:bg-secondary_light' : 'border-t'} onClick={() => asset.symbol && navigate(`/asset/${asset.symbol}`)}><td className="p-3">{asset.imageUrl && <img src={asset.imageUrl} className="mr-2 inline w-6 rounded-full" alt="" />}{asset.symbol || 'Unknown asset'}</td><td className="p-3 text-right">{currency(asset.price)}</td><td className="p-3 text-right">{displayBalance(asset)}</td><td className="p-3 text-right">{currency(asset.value)}</td></tr>)}</tbody></table>{!assets.length && <p className="p-5 text-gray-500">No assets are available for this tracked wallet.</p>}</section>
      <section className="mt-8 overflow-x-auto rounded-lg border bg-primary_light shadow-md"><h2 className="p-4 text-lg font-semibold">Recent activity</h2><table className="min-w-full text-sm"><thead><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Activity</th><th className="p-3 text-left">Asset</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Value</th><th className="p-3 text-left">Transaction</th></tr></thead><tbody>{transactions.map((transaction, index) => <tr key={transaction.id || `${transaction.timestamp}-${index}`} className="border-t"><td className="p-3 whitespace-nowrap">{dateTime(transaction.timestamp)}</td><td className="p-3">{transaction.type || 'Activity'}</td><td className="p-3">{transaction.symbol || '-'}</td><td className="p-3 text-right">{number(transaction.amount)}</td><td className="p-3 text-right">{transaction.value === undefined ? '-' : currency(transaction.value)}</td><td className="max-w-40 truncate p-3 font-mono text-xs" title={transaction.id}>{transaction.id || '-'}</td></tr>)}</tbody></table>{!transactions.length && <p className="p-5 text-gray-500">No recent activity is available for this tracked wallet.</p>}</section>
    </main>}
  </div>;
}

function Unavailable({ address, text }) { return <main className="flex h-[70vh] items-center justify-center text-center"><div><p className="text-lg font-semibold">{text}</p><p className="mt-2 break-all text-sm text-gray-500">{address}</p></div></main>; }

function number(value) { return value === undefined || value === null || value === '' ? '-' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 8 }); }
function currency(value) { return `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} $`; }
function displayBalance(asset) { return asset.displayBalance ?? number(asset.balance ?? asset.rawBalance); }
function dateTime(value) { const date = value && new Date(value); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-US') : value || '-'; }

export default Wallet;
