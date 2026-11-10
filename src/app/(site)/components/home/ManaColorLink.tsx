/* eslint-disable no-undef */
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ManaColorLinkProps {
  symbol: string;
  name: string;
  color: string;
  href: string;
}

export default function ManaColorLink({ symbol, name, color, href }: ManaColorLinkProps) {
  const isMulti = symbol === 'M';

  return (
    <Link
      href={href}
      style={{ '--mana': color } as React.CSSProperties}
      className="group relative isolate flex flex-col items-center gap-3 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] px-2 py-6 hover:-translate-y-1 hover:border-[color:color-mix(in_oklch,var(--mana)_60%,transparent)] focus-visible:-translate-y-1"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklch,var(--mana)_28%,transparent),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {isMulti ? (
        <span
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-full bg-[conic-gradient(var(--mana-w),var(--mana-u),var(--mana-b),var(--mana-r),var(--mana-g),var(--mana-w))] transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110"
        >
          <span className="h-5 w-5 rounded-full bg-background" />
        </span>
      ) : (
        <i
          aria-hidden
          style={{ fontSize: '2.25rem' }}
          className={cn(
            'ms ms-cost ms-shadow transition-transform duration-300 group-hover:scale-110',
            `ms-${symbol.toLowerCase()}`,
          )}
        />
      )}
      <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-foreground">
        {name}
      </span>
    </Link>
  );
}
