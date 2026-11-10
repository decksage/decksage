/* eslint-disable no-undef */
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isOptimizableImage } from '@/lib/images';

type DeckCardProps = {
  deck: {
    id: string;
    name: string;
    format: string;
    representative_card_image_url: string | null;
    color_identity: string[] | null;
    creator?: { username: string | null; avatar_url: string | null } | null;
  };
  showCreator?: boolean;
  badge?: string;
};

export default function DeckCard({ deck, showCreator = false, badge }: DeckCardProps) {
  const colors = deck.color_identity?.length ? deck.color_identity : ['C'];
  const strip =
    colors.length === 1
      ? `var(--mana-${colors[0].toLowerCase()})`
      : `linear-gradient(90deg, ${colors.map((c) => `var(--mana-${c.toLowerCase()})`).join(', ')})`;
  const creatorName = deck.creator?.username || 'Anônimo';

  return (
    <Link
      href={`/decksage/${deck.id}`}
      className="frame group flex h-full flex-col [--cut:16px] hover:-translate-y-0.5 hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
    >
      <div className="chamfer-tl relative m-px aspect-[16/10] overflow-hidden bg-secondary [--cut:15px]">
        {deck.representative_card_image_url ? (
          <Image
            src={deck.representative_card_image_url}
            alt=""
            fill
            unoptimized={!isOptimizableImage(deck.representative_card_image_url)}
            quality={60}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-[center_22%] transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: strip }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-background/80 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            {badge}
          </span>
        )}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 opacity-80"
          style={{ background: strip }}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="kicker">{deck.format}</span>
          <span className="flex items-center gap-0.5" aria-label={`Cores: ${colors.join(', ')}`}>
            {colors.map((c) => (
              <i
                key={c}
                className={`ms ms-${c.toLowerCase()} ms-cost`}
                style={{ fontSize: '0.95rem' }}
                aria-hidden
              />
            ))}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
          {deck.name}
        </h3>
        {showCreator && (
          <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-muted-foreground">
            <Avatar className="h-6 w-6 border border-white/10">
              <AvatarImage src={deck.creator?.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {creatorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {creatorName}
          </div>
        )}
      </div>
    </Link>
  );
}

export function DeckGrid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</ul>;
}
