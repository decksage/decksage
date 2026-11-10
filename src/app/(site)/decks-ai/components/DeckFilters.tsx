import Link from 'next/link';
import { cn } from '@/lib/utils';

const FORMATS = ['Commander', 'Standard', 'Pioneer', 'Modern', 'Pauper'];

export default function DeckFilters({ activeFormat }: { activeFormat?: string }) {
  const options = [
    { label: 'Todos', value: '' },
    ...FORMATS.map((f) => ({ label: f, value: f.toLowerCase() })),
  ];

  return (
    <nav aria-label="Filtrar por formato">
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {options.map(({ label, value }) => {
          const active = (activeFormat ?? '') === value;
          return (
            <li key={label} className="shrink-0">
              <Link
                href={value ? `/decks-ai?format=${value}` : '/decks-ai'}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-full border px-5 font-display text-xs font-semibold uppercase tracking-[0.14em] transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground',
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
