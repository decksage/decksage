import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LatestSetItem from './LatestSetItem';
import SectionHeading from './SectionHeading';

export interface SetData {
  code: string;
  name: string;
  iconUrl?: string;
}

export default function LatestSetsSection({ sets }: { sets: SetData[] }) {
  if (!sets || sets.length === 0) return null;

  return (
    <section>
      <SectionHeading
        index="03"
        kicker="Guia por coleções"
        title="Últimas coleções"
        action={{ href: '/collections', label: 'Ver todas' }}
        className="reveal"
      />
      <div className="reveal mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sets.slice(0, 3).map((set, i) => (
          <LatestSetItem key={set.code} set={set} isNewest={i === 0} />
        ))}
        <Link
          href="/collections"
          className="group flex h-full min-h-[11rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 p-6 text-center hover:border-primary/70 hover:bg-primary/5"
        >
          <ArrowRight className="h-8 w-8 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            Todas as coleções
          </span>
        </Link>
      </div>
    </section>
  );
}
