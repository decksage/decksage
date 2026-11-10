/* eslint-disable no-undef */
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SectionHeading({
  index,
  kicker,
  title,
  description,
  action,
  className,
}: {
  index: string;
  kicker: string;
  title: React.ReactNode;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        <p className="kicker flex items-center gap-3">
          <span className="text-muted-foreground tabular-nums">{index}</span>
          <span className="h-px w-8 bg-primary/60" aria-hidden />
          {kicker}
        </p>
        <h2 className="mt-4 text-balance font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground hover:text-primary"
        >
          {action.label}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
