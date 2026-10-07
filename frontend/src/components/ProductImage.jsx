import { fileUrl } from '../api/client';

export default function ProductImage({ src, name, className = '' }) {
  if (src) {
    return <img src={fileUrl(src)} alt={name || ''} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`grid h-full w-full place-items-center bg-neutral-100 text-neutral-300 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="M21 16l-5-5-8 9" />
      </svg>
    </div>
  );
}