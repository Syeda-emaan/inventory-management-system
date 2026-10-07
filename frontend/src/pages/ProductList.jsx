import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../api/client';
import Pagination from '../components/Pagination';
import ErrorBox from '../components/ErrorBox';
import ProductImage from '../components/ProductImage';
import { useCategories } from '../hooks/useLookups';
import { inputCls, btnCls, btnLight, fmtMoney } from '../components/ui';

export default function ProductList() {
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category_id: '', min_price: '', max_price: '', low_stock: sp.get('low') === '1', sort: 'created_at', order: 'desc',
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, low_stock: sp.get('low') === '1' }));
    setPage(1);
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = {
    page, limit: 12, search,
    category_id: filters.category_id,
    min_price: filters.min_price,
    max_price: filters.max_price,
    low_stock: filters.low_stock ? 'true' : '',
    sort: filters.sort,
    order: filters.order,
  };
  Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);

  const categories = useCategories();
  const list = useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await api.get('/products', { params })).data,
    placeholderData: keepPreviousData,
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const exportCsv = () => {
    const { page: _p, limit: _l, sort: _s, order: _o, ...rest } = params;
    window.open(`${import.meta.env.VITE_API_URL}/products/export/csv?${new URLSearchParams(rest)}`, '_blank');
  };

  const cats = categories.data || [];
  const totalCount = cats.reduce((s, c) => s + (c.product_count || 0), 0);
  const side = (active) =>
    `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
      active ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
    }`;

  return (
    <div>
      {/* Hero banner (optional photo: public/hero.jpg) */}
      <div
        className="relative overflow-hidden rounded-3xl bg-neutral-900 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(110deg, rgba(23,23,23,.95) 35%, rgba(23,23,23,.55)), url('/hero.jpg')" }}
      >
        <div className="relative z-10 grid items-center gap-6 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <p className="text-sm font-medium text-neutral-300">Product Catalog</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Every item in one place,<br />always ready.
            </h1>
            <div className="mt-6 flex max-w-lg items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5">
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search name or SKU..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <button className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
                onClick={() => { setSearch(searchInput); setPage(1); }}>Search</button>
            </div>
          </div>
    
        </div>
      </div>

      <ErrorBox error={list.error || del.error} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit space-y-6 rounded-3xl border border-neutral-200 bg-white p-5">
          <div>
            <h3 className="mb-2 text-sm font-bold">Category</h3>
            <button className={side(filters.category_id === '')} onClick={() => setFilter('category_id', '')}>
              All Products
              <span className="rounded-md bg-red-500 px-1.5 text-xs text-white">{totalCount}</span>
            </button>
            {cats.map((c) => (
              <button key={c.id} className={side(String(filters.category_id) === String(c.id))}
                onClick={() => setFilter('category_id', c.id)}>
                {c.name}
                <span className="text-xs opacity-60">{c.product_count}</span>
              </button>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">Price</h3>
            <div className="flex gap-2">
              <input className={inputCls} type="number" placeholder="Min" value={filters.min_price}
                onChange={(e) => setFilter('min_price', e.target.value)} />
              <input className={inputCls} type="number" placeholder="Max" value={filters.max_price}
                onChange={(e) => setFilter('max_price', e.target.value)} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">Sort</h3>
            <select className={`${inputCls} mb-2`} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
              <option value="created_at">Newest</option>
              <option value="name">Name</option>
              <option value="sku">SKU</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
            </select>
            <select className={inputCls} value={filters.order} onChange={(e) => setFilter('order', e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-black" checked={filters.low_stock}
              onChange={(e) => setFilter('low_stock', e.target.checked)} />
            Low stock only
          </label>

          <button className={`${btnLight} w-full`} onClick={exportCsv}>Export CSV</button>
          <Link to="/products/new" className={`${btnCls} w-full`}>+ New Product</Link>
        </aside>

        {/* Grid */}
        <section>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {(list.data?.data || []).map((p) => {
              const low = p.quantity <= p.reorder_level;
              return (
                <div key={p.id} className="rounded-3xl border border-neutral-200 bg-white p-3 transition hover:shadow-md">
                  <Link to={`/products/${p.id}`} className="relative block aspect-square overflow-hidden rounded-2xl">
                    <ProductImage src={p.image} name={p.name} category={p.category_name} />
                    {p.category_name && (
                      <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm">
                        {p.category_name}
                      </span>
                    )}
                  </Link>
                  <div className="mt-3 flex items-start justify-between gap-2 px-1">
                    <Link to={`/products/${p.id}`} className="font-bold leading-tight hover:underline">{p.name}</Link>
                    <span className="font-extrabold">${fmtMoney(p.price)}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-2 px-1 text-xs text-neutral-500">
                    {p.sku}
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${low ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {p.quantity} in stock
                    </span>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link to={`/products/${p.id}/edit`} className={btnLight}>Edit</Link>
                    <Link to={`/products/${p.id}`} className={btnCls}>View</Link>
                  </div>
                  <button className="mt-2 px-1 text-xs font-medium text-red-500 hover:underline"
                    onClick={() => confirm('Delete this product?') && del.mutate(p.id)}>
                    Delete
                  </button>
                </div>
              );
            })}
          </div>

          {list.data && !list.data.data.length && (
            <p className="rounded-2xl bg-white p-8 text-center text-neutral-500">No products found.</p>
          )}
          <Pagination pagination={list.data?.pagination} onPage={setPage} />
        </section>
      </div>
    </div>
  );
}
