import '../App.css';
import { useState } from 'react';
import Chart from 'react-apexcharts';
import { useParams } from 'react-router-dom';
import { workerApi } from '../api/worker';
import { assetHistoryFrom, assetsFrom, swapsFrom } from '../data/normalizers';
import { useWorkerResource } from '../hooks/useWorkerResource';
import DataStatus from './DataStatus';
import Navbar from './Navbar';
import SwapTable from './SwapTable';

function Asset() {
  const { symbol } = useParams();
  const [chartMin, setChartMin] = useState('01 Dec 2023');
  const result = useWorkerResource((options) => workerApi.asset(symbol, options), [symbol]);
  const swaps = useWorkerResource(workerApi.swaps, []);
  const asset = assetsFrom(result.data?.asset ? [result.data.asset] : result.data)[0];
  const history = assetHistoryFrom(result.data?.asset || result.data).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const dates = history.map(([date]) => date);
  const prices = history.map(([, price]) => price);
  const price = Number(asset?.price_usd || 0);
  const marketCap = Number(asset?.market_cap_usd || 0);
  const chartConfig = { type: 'area', height: 500, series: [{ name: '', data: prices }], options: { chart: { toolbar: { show: false } }, colors: ['#2ecc71'], stroke: { curve: 'smooth', width: 1 }, dataLabels: { enabled: false }, xaxis: { type: 'datetime', min: new Date(chartMin).getTime(), categories: dates }, yaxis: { labels: { formatter: (value) => `${value.toFixed(6)}$` } } } };
  const setRange = (days) => { const date = new Date(); date.setDate(date.getDate() - days); setChartMin(dates[0] && date < new Date(dates[0]) ? new Date(dates[0]) : date); };

  return <div className="App bg-background_light font-poppins dark:bg-background_dark"><Navbar /><DataStatus meta={result.meta} error={result.error} />
    {result.loading ? <div className="p-10 text-center">Loading asset...</div> : !asset ? <main className="flex h-[70vh] items-center justify-center">No Worker data for {symbol}.</main> : <main className="p-5">
      <div className="flex items-center gap-3"><img src={asset.image_uri} className="w-10 rounded" alt="" /><div><strong>{asset.name} | {asset.symbol}</strong><p className="text-xs text-gray-500">{asset.contract_principal || asset.asset_identifier}</p></div></div>
      <div className="grid gap-4 py-8 md:grid-cols-3"><Card label="Price" value={`${price.toFixed(5)} $`} detail={`${Number(asset.change_24h || 0).toFixed(2)}% change`} /><Card label="Capitalisation" value={`${Number(marketCap || 0).toLocaleString('en')} $`} detail={`${Number(asset.total_supply || 0).toLocaleString('en')} tokens`} /><Card label="Holders" value={asset.holders ?? 'Unavailable'} /></div>
      <section className="rounded-lg border p-4"><div className="flex gap-4">{[[7, '1W'], [30, '1M'], [365, '1Y'], [1000, 'MAX']].map(([days, label]) => <button className="rounded border px-3 text-xs" key={label} onClick={() => setRange(days)}>{label}</button>)}</div>{prices.length ? <Chart {...chartConfig} /> : <p className="py-20 text-center text-gray-500">No price history available.</p>}</section>
      {swapsFrom(swaps.data).length > 0 && <SwapTable SwapsData={swapsFrom(swaps.data).filter((swap) => JSON.stringify(swap).includes(asset.symbol))} />}
    </main>}
  </div>;
}

function Card({ label, value, detail }) { return <div className="rounded-lg border bg-primary_light p-6 shadow dark:bg-secondary_dark"><p>{label}</p><p className="text-2xl">{value}</p>{detail && <p className="text-sm text-gray-500">{detail}</p>}</div>; }

export default Asset;
