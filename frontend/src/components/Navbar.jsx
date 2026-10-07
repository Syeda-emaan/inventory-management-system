import { NavLink, Link } from 'react-router-dom';
import { btnCls } from './ui';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/suppliers', label: 'Suppliers' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-black text-sm text-white">▲</span>
          Stockly
        </Link>

        <nav className="flex gap-1 rounded-full bg-neutral-100 p-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  isActive ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
                }`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/products/new" className={btnCls}>+ New Product</Link>
      </div>
    </header>
  );
}