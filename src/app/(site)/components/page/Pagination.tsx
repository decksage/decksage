import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) result.push('…');
    result.push(p);
  });
  return result;
}

export default function Pagination({
  basePath,
  currentPage,
  totalPages,
  params = {},
  className,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && search.set(k, v));
    if (page > 1) search.set('page', String(page));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const edge =
    'inline-flex h-10 items-center gap-1.5 rounded-md border border-white/10 px-3 text-sm text-muted-foreground';

  return (
    <nav
      aria-label="Paginação"
      className={cn('mt-16 flex items-center justify-center gap-2', className)}
    >
      {currentPage > 1 ? (
        <Link
          href={href(currentPage - 1)}
          rel="prev"
          className={cn(edge, 'hover:border-white/25 hover:text-foreground')}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span aria-disabled className={cn(edge, 'opacity-40')}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </span>
      )}

      <ol className="flex items-center gap-1">
        {pageWindow(currentPage, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={cn(
                  'grid h-10 min-w-10 place-items-center rounded-md px-2 font-display text-sm font-semibold tabular-nums',
                  p === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>

      {currentPage < totalPages ? (
        <Link
          href={href(currentPage + 1)}
          rel="next"
          className={cn(edge, 'hover:border-white/25 hover:text-foreground')}
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-disabled className={cn(edge, 'opacity-40')}>
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
