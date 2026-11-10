import Link from 'next/link';
import type { SetData } from './LatestSetsSection';

export default function LatestSetItem({ set, isNewest }: { set: SetData; isNewest?: boolean }) {
  return (
    <Link
      href={`/collections/${set.code.toLowerCase()}`}
      className="frame group flex h-full flex-col justify-between gap-8 p-6 [--cut:14px] hover:-translate-y-1 hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
    >
      <div className="flex items-start justify-between">
        {set.iconUrl ? (
          <img
            src={set.iconUrl}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className="h-14 w-14 object-contain invert transition-transform duration-500 ease-out group-hover:rotate-[-6deg] group-hover:scale-110"
          />
        ) : (
          <span className="h-14 w-14" />
        )}
        {isNewest && (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Novo
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {set.code}
        </p>
        <h3 className="mt-1 text-balance font-display text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {set.name}
        </h3>
      </div>
    </Link>
  );
}
