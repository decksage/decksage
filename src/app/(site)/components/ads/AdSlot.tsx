import { cn } from '@/lib/utils';
import DynamicAdSlot from './DynamicAdSlot';
import { getAdConfig, type AdPlacement } from './getAdConfig';

export default async function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const config = await getAdConfig(placement);
  if (!config) return null;

  return (
    <aside aria-label="Publicidade" className={cn('ad-slot', className)}>
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        Publicidade
      </p>
      <div className="min-h-[100px]">
        <DynamicAdSlot adConfig={config} />
      </div>
    </aside>
  );
}
