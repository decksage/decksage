import { cn } from '@/lib/utils';

const FORMATS: { key: string; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'pioneer', label: 'Pioneer' },
  { key: 'modern', label: 'Modern' },
  { key: 'legacy', label: 'Legacy' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'commander', label: 'Commander' },
  { key: 'pauper', label: 'Pauper' },
  { key: 'brawl', label: 'Brawl' },
];

const STATUS: Record<string, { label: string; className: string }> = {
  legal: { label: 'Legal', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  restricted: {
    label: 'Restrita',
    className: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  },
  banned: { label: 'Banida', className: 'border-red-400/30 bg-red-400/10 text-red-300' },
  not_legal: { label: 'Não', className: 'border-white/5 bg-transparent text-muted-foreground/70' },
};

export default function CardLegalities({ legalities }: { legalities?: Record<string, string> }) {
  if (!legalities) return null;

  return (
    <section aria-labelledby="legalidade">
      <h2 id="legalidade" className="kicker mb-4">
        Legalidade
      </h2>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FORMATS.map(({ key, label }) => {
          const status = STATUS[legalities[key] ?? 'not_legal'] ?? STATUS.not_legal;
          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2',
                status.className,
              )}
            >
              <dt className="text-xs font-medium text-foreground/90">{label}</dt>
              <dd className="font-display text-[11px] font-semibold uppercase tracking-wider">
                {status.label}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
