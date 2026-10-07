import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ErrorBox from '../components/ErrorBox';
import ProductImage from '../components/ProductImage';
import { fmtDate, fmtMoney, tableWrap, th, td, typeBadge } from '../components/ui';

export default function Dashboard() {
  const stats = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data.data,
  });
  const lows = useQuery({
    queryKey: ['products', 'dash-low'],
    queryFn: async () =>
      (await api.get('/products', { params: { low_stock: 'true', sort: 'quantity', order: 'asc', limit: 6 } })).data.data,
  });

  if (stats.isLoading) return <p className="text-neutral-500">Loading...</p>;
  if (stats.error) return <ErrorBox error={stats.error} />;
  const d = stats.data;

  const cards = [
    ['📦', 'Total Products', d.total_products, 'bg-sky-50 text-sky-700'],
    ['⚠️', 'Low Stock', d.low_stock, 'bg-amber-50 text-amber-700'],
    ['🚫', 'Out of Stock', d.out_of_stock, 'bg-red-50 text-red-700'],
    ['💰', 'Inventory Value', fmtMoney(d.inventory_value), 'bg-emerald-50 text-emerald-700'],
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 p-8 text-white md:p-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-medium text-neutral-300">Welcome back</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Inventory Overview</h1>
          <p className="mt-3 text-neutral-300">
            You have <b className="text-white">{d.total_products}</b> products, and{' '}
            <b className="text-amber-300">{d.low_stock}</b> of them are running low on stock.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/products/new" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-neutral-200">
              + Add Product
            </Link>
            <Link to="/products?low=1" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              View Low Stock
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([icon, label, value, tone]) => (
          <div key={label} className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${tone}`}>{icon}</div>
            <p className="mt-4 text-sm text-neutral-500">{label}</p>
            <p className="text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Needs restock */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Needs Restock</h2>
          <Link to="/products?low=1" className="text-sm font-semibold text-neutral-500 hover:text-black">See all →</Link>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {(lows.data || []).map((p) => (
            <li key={p.id}>
              <Link to={`/products/${p.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-neutral-50">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <ProductImage src={p.image} name={p.name} category={p.category_name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.sku}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {p.quantity === 0 ? 'Out' : `${p.quantity} left`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {lows.data && !lows.data.length && <p className="text-sm text-neutral-500">All products are well stocked.</p>}
      </div>

      {/* Recent movements */}
      <div>
        <h2 className="mb-3 text-xl font-bold">Recent Stock Movements</h2>
        <div className={tableWrap}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className={th}>Product</th><th className={th}>Type</th><th className={th}>Change</th>
                <th className={th}>After</th><th className={th}>Reason</th><th className={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {d.recent_movements.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100">
                  <td className={td}>{m.product_name} <span className="text-neutral-400">({m.sku})</span></td>
                  <td className={td}><span className={typeBadge(m.change_type)}>{m.change_type}</span></td>
                  <td className={`${td} font-semibold`}>{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</td>
                  <td className={td}>{m.quantity_after}</td>
                  <td className={td}>{m.reason}</td>
                  <td className={`${td} text-neutral-500`}>{fmtDate(m.created_at)}</td>
                </tr>
              ))}
              {!d.recent_movements.length && (
                <tr><td className="p-5 text-neutral-500" colSpan={6}>No stock movements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}