export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.total === 0) return null;
  const { page, totalPages, total } = pagination;

  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) nums.push(i);

  const navBtn = 'rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-30';

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
      <button className={navBtn} disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button>
      <div className="flex items-center gap-1">
        {nums[0] > 1 && <span className="px-1 text-neutral-400">…</span>}
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`h-9 w-9 rounded-full text-sm font-semibold ${
              n === page ? 'bg-neutral-200 text-black' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            {n}
          </button>
        ))}
        {nums[nums.length - 1] < totalPages && <span className="px-1 text-neutral-400">…</span>}
        <span className="ml-3 text-xs text-neutral-400">{total} total</span>
      </div>
      <button className={navBtn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}