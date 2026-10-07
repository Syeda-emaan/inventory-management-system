import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import ErrorBox from '../components/ErrorBox';
import { useCategories, useSuppliers } from '../hooks/useLookups';
import { inputCls, textareaCls, btnCls, btnLight, card } from '../components/ui';

const empty = { sku: '', name: '', description: '', price: '', category_id: '', quantity: 0, reorder_level: 10 };

// component ke bahar rakha hai taake typing ke waqt focus na jaye
const Field = ({ label, children }) => (
  <div>
    <label className="mb-1 block pl-1 text-xs font-medium text-neutral-500">{label}</label>
    {children}
  </div>
);

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(empty);
  const [links, setLinks] = useState([]);
  const [files, setFiles] = useState([]);

  const categories = useCategories();
  const suppliers = useSuppliers();

  const existing = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data.data,
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing.data) return;
    const p = existing.data;
    setForm({
      sku: p.sku, name: p.name, description: p.description || '', price: p.price,
      category_id: p.category_id ?? '', quantity: p.quantity, reorder_level: p.reorder_level,
    });
    setLinks(p.suppliers.map((s) => ({ supplier_id: String(s.id), supply_price: s.supply_price ?? '' })));
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        sku: form.sku,
        name: form.name,
        description: form.description || null,
        price: form.price,
        category_id: form.category_id ? Number(form.category_id) : null,
        reorder_level: form.reorder_level,
        suppliers: links.filter((l) => l.supplier_id).map((l) => ({
          supplier_id: Number(l.supplier_id),
          ...(l.supply_price !== '' && l.supply_price != null ? { supply_price: Number(l.supply_price) } : {}),
        })),
      };

      const res = isEdit ? await api.put(`/products/${id}`, body) : await api.post('/products', body);
      const productId = res.data.data.id;

      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('images', f));
        await api.post(`/products/${productId}/images`, fd);
      }
      return productId;
    },
    onSuccess: (productId) => {
      ['products', 'product', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      navigate(`/products/${productId}`);
    },
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updateLink = (i, patch) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  if (isEdit && existing.isLoading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      <p className="mb-5 text-sm text-neutral-500">Enter the product details</p>
      <ErrorBox error={save.error || existing.error} />

      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className={`${card} space-y-4`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SKU"><input className={inputCls} required value={form.sku} onChange={set('sku')} /></Field>
          <Field label="Name"><input className={inputCls} required value={form.name} onChange={set('name')} /></Field>
          <Field label="Price">
            <input className={inputCls} type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category_id} onChange={set('category_id')}>
              <option value="">None</option>
              {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Reorder level">
            <input className={inputCls} type="number" min="0" value={form.reorder_level} onChange={set('reorder_level')} />
          </Field>
        </div>

        <Field label="Description">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={set('description')} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="pl-1 text-xs font-medium text-neutral-500">Suppliers</span>
            <button type="button" className={btnLight}
              onClick={() => setLinks([...links, { supplier_id: '', supply_price: '' }])}>+ Add supplier</button>
          </div>
          {links.map((l, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <select className={inputCls} value={l.supplier_id} onChange={(e) => updateLink(i, { supplier_id: e.target.value })}>
                <option value="">Select supplier</option>
                {(suppliers.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className={`${inputCls} max-w-[150px]`} type="number" step="0.01" min="0" placeholder="Supply price"
                value={l.supply_price} onChange={(e) => updateLink(i, { supply_price: e.target.value })} />
              <button type="button" className={btnLight} onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
        </div>

        <Field label="Images (JPG, PNG, WEBP, max 5)">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm"
            onChange={(e) => setFiles([...e.target.files])} />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
          )}
        </Field>

        <div className="flex gap-2 pt-2">
          <button className={btnCls} disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Product'}</button>
          <Link to="/products" className={btnLight}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
