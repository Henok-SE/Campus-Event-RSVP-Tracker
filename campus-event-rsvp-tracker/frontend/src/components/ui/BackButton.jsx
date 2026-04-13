import { ArrowLeft } from 'lucide-react';
import { Link, useInRouterContext } from 'react-router-dom';

const baseClassName = 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm';

export default function BackButton({ to = null, label = 'Back', className = '' }) {
  const inRouterContext = useInRouterContext();

  if (to && inRouterContext) {
    return (
      <Link to={to} className={`${baseClassName} ${className}`.trim()}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  }

  if (to) {
    return (
      <a href={to} className={`${baseClassName} ${className}`.trim()}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={`${baseClassName} ${className}`.trim()}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
