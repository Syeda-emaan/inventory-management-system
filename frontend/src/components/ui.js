export const inputCls =
  'w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:bg-white';
export const textareaCls =
  'w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white';
export const btnCls =
  'inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50';
export const btnLight =
  'inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50';
export const btnDanger =
  'inline-flex items-center justify-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50';
export const card = 'rounded-3xl border border-neutral-200 bg-white p-5';
export const tableWrap = 'overflow-x-auto rounded-3xl border border-neutral-200 bg-white';
export const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500';
export const td = 'px-4 py-3';

export const typeBadge = (t) =>
  'rounded-full px-2.5 py-1 text-xs font-semibold ' +
  (t === 'IN' ? 'bg-green-100 text-green-700' : t === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700');

export const fmtDate = (d) => new Date(d).toLocaleString();
export const fmtMoney = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });