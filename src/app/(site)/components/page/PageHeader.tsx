/* eslint-disable no-undef */
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PageHeader({
  kicker,
  title,
  description,
  back,
  actions,
  meta,
  className,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn('relative isolate overflow-hidden border-b border-white/5', className)}>
      <div
        aria-hidden
        className="absolute -left-40 -top-56 -z-10 h-[28rem] w-[46rem] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_13%,transparent),transparent)]"
      />
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-10 sm:pb-12 sm:pt-14">
        {back && (
          <Link
            href={back.href}
            className="rise group mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {back.label}
          </Link>
        )}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 max-w-3xl">
            {kicker && (
              <p className="rise kicker flex items-center gap-3">
                <span className="mana-strip h-1 w-8" aria-hidden />
                {kicker}
              </p>
            )}
            <h1
              className="rise mt-4 text-balance break-words font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ '--delay': '60ms' } as React.CSSProperties}
            >
              {title}
            </h1>
            {description && (
              <div
                className="rise mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
                style={{ '--delay': '120ms' } as React.CSSProperties}
              >
                {description}
              </div>
            )}
            {meta && (
              <div
                className="rise mt-5 flex flex-wrap items-center gap-2"
                style={{ '--delay': '160ms' } as React.CSSProperties}
              >
                {meta}
              </div>
            )}
          </div>
          {actions && (
            <div
              className="rise flex shrink-0 flex-wrap items-center gap-3"
              style={{ '--delay': '180ms' } as React.CSSProperties}
            >
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </header>
  );
}

export function MetaChip({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground',
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
      {children}
    </span>
  );
}
