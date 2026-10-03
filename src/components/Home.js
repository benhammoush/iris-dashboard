import '../App.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { workerApi } from '../api/worker';
import { marketHistoryFrom, swapsFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';
import DataStatus from './DataStatus';
import Navbar from './Navbar';
import SwapTable from './SwapTable';
import { useCatalog } from '../contexts/CatalogContext';

function Home() {
  const [chartMin, setChartMin] = useState('01 Dec 2023');
  const { assets, wallets, loading: catalogLoading, meta: catalogMeta, error: catalogError } = useCatalog();
  const navigate = useNavigate();
  const market = useWorkerResource(workerApi.market, []);
  const swapsResult = useWorkerResource(workerApi.swaps, []);
  const sortedAssets = [...assets].sort((a, b) => {
    if (a.market_cap_usd === '--') return 1;
    if (b.market_cap_usd === '--') return -1;
    return b.market_cap_usd - a.market_cap_usd;
  });
  const history = marketHistoryFrom(market.data, sortedAssets).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const dates = history.map(([date]) => date);
  const prices = history.map(([, value]) => value);
  const chartConfig = { type: 'area', height: 420, series: [{ name: '', data: prices }], options: { chart: { toolbar: { show: false } }, colors: ['#2ecc71'], stroke: { curve: 'smooth', width: 1 }, dataLabels: { enabled: false }, xaxis: { type: 'datetime', min: new Date(chartMin).getTime(), categories: dates }, yaxis: { labels: { formatter: (value) => `${value.toFixed(0) / 1000000000}B$` } } } };
  const setRange = (days) => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const first = dates[0] ? new Date(dates[0]) : start;
    setChartMin(start < first ? first : start);
  };

  return <div className="App bg-background_light dark:bg-background_dark">
    <Navbar fees={market.data?.fees} />
    <DataStatus meta={market.meta || catalogMeta} error={market.error || catalogError} />
    {(market.loading || catalogLoading) ? <div className="flex h-screen items-center justify-center"><img src="/logoiris.png" className="w-32" alt="Iris Logo" /></div> : <main>
      <div className="flex flex-col lg:flex-row">
        <section className="w-full p-5 lg:w-1/2"><div className="rounded-lg border bg-primary_light p-5 dark:bg-primary_dark">
          <p className="text-xl dark:text-white">{prices.length ? prices[prices.length - 1].toLocaleString('en', { maximumFractionDigits: 0 }) : '0'}$</p><p className="text-sm dark:text-white">Stacks Blockchain Market Cap</p>
          <div className="flex gap-4 py-4">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button key={label} className="rounded border px-3 text-xs" onClick={() => setRange(days)}>{label}</button>)}</div>
          {prices.length ? <Chart {...chartConfig} /> : <p className="py-20 text-center text-gray-500">No market history available.</p>}
        </div></section>
        <section className="w-full p-5 lg:w-1/2"><div className="overflow-x-auto rounded-lg border"><table className="min-w-full text-sm"><thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>7d</th><th>30d</th><th>Market Cap</th></tr></thead><tbody>{sortedAssets.map((asset) => <tr key={asset.symbol} className="cursor-pointer hover:bg-secondary_light" onClick={() => navigate(`/asset/${asset.symbol}`)}><td className="p-2"><img src={asset.image_uri} className="mr-2 inline w-6 rounded-full" alt="" />{asset.symbol}</td><td>{Number(asset.price_usd || 0).toLocaleString('en')} $</td><Change value={asset.change_24h} /><Change value={asset.change_7d} /><Change value={asset.change_30d} /><td>{Number(asset.market_cap_usd || 0).toLocaleString('en')} $</td></tr>)}</tbody></table></div></section>
      </div>
      <DataStatus meta={swapsResult.meta} error={swapsResult.error} showPriceNotice={false} />
      {swapsFrom(swapsResult.data).length > 0 && <SwapTable SwapsData={swapsFrom(swapsResult.data)} />}
      <section className="p-5"><h2 className="text-lg">Featured wallets</h2>{wallets.length ? <div className="flex gap-3 pt-2">{wallets.map((wallet) => <Link key={wallet.address || wallet} className="rounded border px-3 py-2" to={`/wallet/${wallet.address || wallet}`}>{wallet.label || wallet.address || wallet}</Link>)}</div> : <p className="pt-2 text-sm text-gray-500">No featured wallets are configured.</p>}</section>
      <p className="p-4 text-xs text-gray-500">{market.data?.block_height ? `Block ${market.data.block_height}` : 'Block data unavailable'}</p>
    </main>}
  </div>;
}

function Change({ value }) {
  const number = Number(value || 0);
  return <td className={number > 0 ? 'text-green-400' : 'text-red-400'}>{number.toFixed(2)} %</td>;
}

export default Home;
