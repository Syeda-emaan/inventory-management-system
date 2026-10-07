import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../api/client';
import Pagination from '../components/Pagination';
import ErrorBox from '../components/ErrorBox';
import { useCategories } from '../hooks/useLookups';
import { inputCls, btnCls, btnLight, btnDanger, card, tableWrap, th, td } from '../components/ui';

const empty = { name: '', parent_id: '' };

export default function Categories() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const all = useCategories();
  const list = useQuery({
    queryKey: ['categories', page, search],
    queryFn: async () => (await api.get('/categories', { params: { page, limit: 10, search } })).data,
    placeholderData: keepPreviousData,
  });

  const reset = () => { setForm(empty); setEditId(null); };
  const done = () => { qc.invalidateQueries({ queryKey: ['categories'] }); reset(); };

  const save = useMutation({
    mutationFn: (body) => (editId ? api.put(`/categories/${editId}`, body) : api.post('/categories', body)),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/categories/${id}`), onSuccess: done });

  const submit = (e) => {
    e.preventDefault();
    save.mutate({ name: form.name, parent_id: form.parent_id ? Number(form.parent_id) : null });
  };
  const edit = (c) => { setEditId(c.id); setForm({ name: c.name, parent_id: c.parent_id ?? '' }); };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
      <p className="mb-5 text-sm text-neutral-500">Organize your products into groups</p>

      <form onSubmit={submit} className={`${card} mb-5 flex flex-wrap items-end gap-3`}>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block pl-1 text-xs font-medium text-neutral-500">Name</label>
          <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block pl-1 text-xs font-medium text-neutral-500">Parent (optional)</label>
          <select className={inputCls} value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">None</option>
            {(all.data || []).filter((c) => c.id !== editId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className={btnCls} disabled={save.isPending}>{editId ? 'Update' : 'Add Category'}</button>
        {editId && <button type="button" className={btnLight} onClick={reset}>Cancel</button>}
      </form>

      <ErrorBox error={save.error || del.error} />

      <input className={`${inputCls} mb-4 max-w-xs`} placeholder="Search categories..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

      <div className={tableWrap}>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr><th className={th}>Name</th><th className={th}>Products</th><th className={`${th} text-right`}>Actions</th></tr>
          </thead>
          <tbody>
            {(list.data?.data || []).map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className={`${td} font-semibold`}>{c.name}</td>
                <td className={td}>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{c.product_count}</span>
                </td>
                <td className={`${td} space-x-2 text-right`}>
                  <button className={btnLight} onClick={() => edit(c)}>Edit</button>
                  <button className={btnDanger} onClick={() => confirm('Delete this category?') && del.mutate(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {list.data && !list.data.data.length && (
              <tr><td className="p-5 text-neutral-500" colSpan={3}>No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={list.data?.pagination} onPage={setPage} />
    </div>
  );
}
