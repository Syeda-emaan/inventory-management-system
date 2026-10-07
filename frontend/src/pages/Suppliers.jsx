import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../api/client';
import Pagination from '../components/Pagination';
import ErrorBox from '../components/ErrorBox';
import { inputCls, btnCls, btnLight, btnDanger, card, tableWrap, th, td } from '../components/ui';

const empty = { name: '', email: '', phone: '', address: '' };

export default function Suppliers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const list = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => (await api.get('/suppliers', { params: { page, limit: 10, search } })).data,
    placeholderData: keepPreviousData,
  });

  const reset = () => { setForm(empty); setEditId(null); };
  const done = () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); reset(); };

  const save = useMutation({
    mutationFn: (body) => (editId ? api.put(`/suppliers/${editId}`, body) : api.post('/suppliers', body)),
    onSuccess: done,
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/suppliers/${id}`), onSuccess: done });

  const submit = (e) => {
    e.preventDefault();
    save.mutate({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
    });
  };
  const edit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '' });
  };

  const field = (key, label, type = 'text', required = false) => (
    <div className="min-w-[180px] flex-1">
      <label className="mb-1 block pl-1 text-xs font-medium text-neutral-500">{label}</label>
      <input className={inputCls} type={type} required={required} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Suppliers</h1>
      <p className="mb-5 text-sm text-neutral-500">Your list of suppliers</p>

      <form onSubmit={submit} className={`${card} mb-5 flex flex-wrap items-end gap-3`}>
        {field('name', 'Name', 'text', true)}
        {field('email', 'Email', 'email')}
        {field('phone', 'Phone')}
        {field('address', 'Address')}
        <button className={btnCls} disabled={save.isPending}>{editId ? 'Update' : 'Add Supplier'}</button>
        {editId && <button type="button" className={btnLight} onClick={reset}>Cancel</button>}
      </form>

      <ErrorBox error={save.error || del.error} />

      <input className={`${inputCls} mb-4 max-w-xs`} placeholder="Search suppliers..." value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

      <div className={tableWrap}>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Phone</th>
              <th className={th}>Address</th><th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.data || []).map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className={`${td} font-semibold`}>{s.name}</td>
                <td className={td}>{s.email}</td>
                <td className={td}>{s.phone}</td>
                <td className={td}>{s.address}</td>
                <td className={`${td} space-x-2 text-right`}>
                  <button className={btnLight} onClick={() => edit(s)}>Edit</button>
                  <button className={btnDanger} onClick={() => confirm('Delete this supplier?') && del.mutate(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {list.data && !list.data.data.length && (
              <tr><td className="p-5 text-neutral-500" colSpan={5}>No suppliers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={list.data?.pagination} onPage={setPage} />
    </div>
  );
}
