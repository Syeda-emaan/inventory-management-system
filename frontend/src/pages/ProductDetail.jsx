import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api, { fileUrl } from '../api/client';
import Pagination from '../components/Pagination';
import ProductImage from '../components/ProductImage';
import ErrorBox from '../components/ErrorBox';
import { inputCls, btnCls, btnLight, btnDanger, card, tableWrap, th, td, typeBadge, fmtDate, fmtMoney } from '../components/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [histPage, setHistPage] = useState(1);
  const [stock, setStock] = useState({ change_type: 'IN', quantity: '', reason: '' });
  const [files, setFiles] = useState([]);
  const [sel, setSel] = useState(0);

  const product = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data.data,
  });
  const history = useQuery({
    queryKey: ['history', id, histPage],
    queryFn: async () => (await api.get(`/products/${id}/history`, { params: { page: histPage, limit: 10 } })).data,
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    ['product', 'history', 'products', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const changeStock = useMutation({
    mutationFn: () => api.post(`/products/${id}/stock`, {
      change_type: stock.change_type,
      quantity: stock.quantity,
      ...(stock.reason ? { reason: stock.reason } : {}),
    }),
    onSuccess: () => { setStock({ ...stock, quantity: '', reason: '' }); setHistPage(1); refresh(); },
  });
  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      return api.post(`/products/${id}/images`, fd);
    },
    onSuccess: () => { setFiles([]); refresh(); },
  });
  const makePrimary = useMutation({
    mutationFn: (imageId) => api.patch(`/products/${id}/images/${imageId}/primary`),
    onSuccess: refresh,
  });
  const delImage = useMutation({
    mutationFn: (imageId) => api.delete(`/products/${id}/images/${imageId}`),
    onSuccess: () => { setSel(0); refresh(); },
  });

  if (product.isLoading) return <p className="text-neutral-500">Loading...</p>;
  if (product.error) return <ErrorBox error={product.error} />;
  const p = product.data;
  const current = p.images[sel] || p.images[0];
  const low = p.quantity <= p.reorder_level;

  return (
    <div className="space-y-8">
      <Link to="/products" className="text-sm font-medium text-neutral-500 hover:text-black">← Back to products</Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
                   <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-100">
            <ProductImage src={current?.file_path} name={p.name} category={p.category_name} big />
          </div>
          <ErrorBox error={upload.error || makePrimary.error || delImage.error} />
          <div className="mt-3 flex flex-wrap gap-3">
            {p.images.map((img, i) => (
              <div key={img.id} className="w-20 text-center">
                <img src={fileUrl(img.file_path)} alt="" onClick={() => setSel(i)}
                  className={`h-20 w-20 cursor-pointer rounded-xl object-cover ${current?.id === img.id ? 'ring-2 ring-black' : ''}`} />
                {img.is_primary
                  ? <p className="mt-1 text-[11px] font-semibold text-green-600">Primary</p>
                  : <button className="mt-1 text-[11px] text-blue-600" onClick={() => makePrimary.mutate(img.id)}>Make primary</button>}
                <button className="block w-full text-[11px] text-red-500"
                  onClick={() => confirm('Delete image?') && delImage.mutate(img.id)}>Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm"
              onChange={(e) => setFiles([...e.target.files])} />
            <button className={btnCls} disabled={!files.length || upload.isPending} onClick={() => upload.mutate()}>
              Upload
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          {p.category_name && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{p.category_name}</span>
          )}
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">SKU: {p.sku}</p>
          <p className="mt-4 text-3xl font-extrabold">${fmtMoney(p.price)}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 ${low ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-xs text-neutral-500">In stock</p>
              <p className={`text-2xl font-extrabold ${low ? 'text-red-600' : 'text-green-700'}`}>{p.quantity}</p>
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <p className="text-xs text-neutral-500">Reorder level</p>
              <p className="text-2xl font-extrabold">{p.reorder_level}</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-neutral-600">{p.description || 'No description.'}</p>

          <h3 className="mb-2 mt-5 font-bold">Suppliers</h3>
          {p.suppliers.length ? (
            <ul className="space-y-1 text-sm">
              {p.suppliers.map((s) => (
                <li key={s.id} className="flex justify-between rounded-xl bg-neutral-50 px-3 py-2">
                  <span>{s.name}</span>
                  {s.supply_price != null && <span className="font-semibold">${fmtMoney(s.supply_price)}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-neutral-500">No suppliers linked.</p>}

          <Link to={`/products/${id}/edit`} className={`${btnLight} mt-5`}>Edit Product</Link>
        </div>
      </div>

      {/* Stock */}
      <div className={card}>
        <h3 className="mb-3 text-lg font-bold">Update Stock</h3>
        <ErrorBox error={changeStock.error} />
        <form onSubmit={(e) => { e.preventDefault(); changeStock.mutate(); }}
          className="grid gap-3 md:grid-cols-[200px_140px_1fr_auto]">
          <select className={inputCls} value={stock.change_type}
            onChange={(e) => setStock({ ...stock, change_type: e.target.value })}>
            <option value="IN">IN (add)</option>
            <option value="OUT">OUT (remove)</option>
            <option value="ADJUST">ADJUST (set exact)</option>
          </select>
          <input className={inputCls} type="number" min="0" required placeholder="Quantity"
            value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: e.target.value })} />
          <input className={inputCls} placeholder="Reason (optional)" value={stock.reason}
            onChange={(e) => setStock({ ...stock, reason: e.target.value })} />
          <button className={btnCls} disabled={changeStock.isPending}>Apply</button>
        </form>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-3 text-xl font-bold">Inventory History</h3>
        <div className={tableWrap}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Change</th><th className={th}>After</th><th className={th}>Reason</th></tr>
            </thead>
            <tbody>
              {(history.data?.data || []).map((h) => (
                <tr key={h.id} className="border-t border-neutral-100">
                  <td className={`${td} text-neutral-500`}>{fmtDate(h.created_at)}</td>
                  <td className={td}><span className={typeBadge(h.change_type)}>{h.change_type}</span></td>
                  <td className={`${td} font-semibold`}>{h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}</td>
                  <td className={td}>{h.quantity_after}</td>
                  <td className={td}>{h.reason}</td>
                </tr>
              ))}
              {history.data && !history.data.data.length && (
                <tr><td className="p-5 text-neutral-500" colSpan={5}>No history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={history.data?.pagination} onPage={setHistPage} />
      </div>
    </div>
  );
}
