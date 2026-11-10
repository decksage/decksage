/* eslint-disable no-undef */
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LinkAction = { href: string; label: string };

function isLinkAction(action: unknown): action is LinkAction {
  return typeof action === 'object' && action !== null && 'href' in action && 'label' in action;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'default',
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: LinkAction | React.ReactNode;
  tone?: 'default' | 'error';
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center',
        tone === 'error'
          ? 'border-red-500/30 bg-red-500/[0.04]'
          : 'border-white/10 bg-white/[0.015]',
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            'mb-5 grid h-14 w-14 place-items-center rounded-full border',
            tone === 'error'
              ? 'border-red-500/30 text-red-400'
              : 'border-white/10 bg-white/[0.03] text-muted-foreground',
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
        {title}
      </p>
      {description && (
        <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </div>
      )}
      {action && (
        <div className="mt-6">
          {isLinkAction(action) ? (
            <Link
              href={action.href}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
