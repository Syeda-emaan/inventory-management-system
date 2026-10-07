import { Link } from 'react-router-dom';

const col = 'space-y-2 text-sm text-neutral-400';
const link = 'hover:text-white transition';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-sm text-black">▲</span>
            Stockly
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Manage thousands of products, suppliers and stock history in one place. Fast search, clean reports
            and CSV export.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Explore</h4>
          <ul className={col}>
            <li><Link className={link} to="/">Dashboard</Link></li>
            <li><Link className={link} to="/products">All Products</Link></li>
            <li><Link className={link} to="/categories">Categories</Link></li>
            <li><Link className={link} to="/suppliers">Suppliers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Quick Actions</h4>
          <ul className={col}>
            <li><Link className={link} to="/products/new">Add new product</Link></li>
            <li><Link className={link} to="/products?low=1">View low stock items</Link></li>
            <li>
              <a className={link} target="_blank" rel="noreferrer"
                href={`${import.meta.env.VITE_API_URL}/products/export/csv`}>Export products CSV</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Features</h4>
          <ul className={col}>
            <li>Stock IN / OUT / ADJUST</li>
            <li>Complete inventory history</li>
            <li>Search, filter, sort, pagination</li>
            <li>Product images &amp; suppliers</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-neutral-500 md:px-8">
          <span>© {new Date().getFullYear()} Stockly Inventory Management</span>
          <span>React · Express · PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
