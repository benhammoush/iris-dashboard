import '../App.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function SwapTable({ SwapsData }) {
  const [sort, setSort] = useState({ key: 'date', direction: 'asc' });
  const swaps = [...SwapsData].sort((left, right) => {
    const a = sort.key === 'amount' || sort.key === 'value' ? Number(left[sort.key]?.amount || left[sort.key] || 0) : String(left[sort.key]?.symbol || left[sort.key] || '');
    const b = sort.key === 'amount' || sort.key === 'value' ? Number(right[sort.key]?.amount || right[sort.key] || 0) : String(right[sort.key]?.symbol || right[sort.key] || '');
    return (a > b ? 1 : a < b ? -1 : 0) * (sort.direction === 'asc' ? 1 : -1);
  });
  const toggleSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));

  return <section className="flex py-7"><div className="w-full overflow-x-auto"><div className="max-h-[600px] w-[98vw] overflow-y-scroll rounded-lg border shadow-md dark:border-neutral-800 dark:text-white">
    <table className="min-w-full"><thead className="sticky top-0 bg-primary_light dark:bg-primary_dark"><tr className="text-left">
      <Header label="Date" onClick={() => toggleSort('date')} />
      <Header label="Type" onClick={() => toggleSort('type')} />
      <Header label="Asset" onClick={() => toggleSort('asset')} />
      <Header label="Amount" onClick={() => toggleSort('amount')} />
      <Header label="Value" onClick={() => toggleSort('value')} />
      <th className="p-3">Category</th>
      <Header label="Maker" onClick={() => toggleSort('maker')} />
      <th className="p-3">Transaction</th>
    </tr></thead><tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
      {swaps.map((swap, index) => <tr key={`${swap.transaction || swap.date}-${index}`} className="hover:bg-secondary_light dark:hover:bg-secondary_dark">
        <td className="p-3">{swap.date}</td>
        <td className={swap.type === 'BUY' ? 'p-3 text-green-500' : 'p-3 text-red-500'}>{swap.type}</td>
        <td className="p-3"><Link className="flex items-center gap-2" to={`/asset/${swap.asset.symbol}`}>{swap.asset.image_uri && <img src={swap.asset.image_uri} className="w-6 rounded-full" alt="" />}{swap.asset.symbol}</Link></td>
        <td className="p-3 text-right">{formatNumber(swap.amount)}</td>
        <td className="p-3 text-right">{formatNumber(swap.value.amount)} {swap.value.symbol}</td>
        <td className="p-3"><Category amount={swap.categoryAmount} /></td>
        <td className="p-3"><Link to={`/wallet/${swap.maker}`}>{swap.maker}</Link></td>
        <td className="p-3">{swap.transaction}</td>
      </tr>)}
    </tbody></table>
  </div></div></section>;
}

function Header({ label, onClick }) {
  return <th className="cursor-pointer p-3" onClick={onClick}>{label}</th>;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function Category({ amount }) {
  const value = Number(amount || 0);
  // Keep the established cutoffs: <100, 100-499, 500-4999, and >=5000.
  const icon = value < 100 ? 'fish.svg' : value < 500 ? 'shrimp.svg' : value < 5000 ? 'dolphin.svg' : 'whale.svg';
  return <img src={`/${icon}`} className="mx-auto w-6 rounded-full" alt="" />;
}

export default SwapTable;
