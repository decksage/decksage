'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScryfallLike = {
  id: string;
  name: string;
  type_line?: string;
  image_uris?: { normal?: string };
  card_faces?: { image_uris?: { normal?: string } }[];
};

export function getCardImages(card: ScryfallLike) {
  const front = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal;
  const back = card.image_uris ? undefined : card.card_faces?.[1]?.image_uris?.normal;
  return { front, back };
}

export default function CardTile({
  card,
  showCaption = true,
  eager = false,
}: {
  card: ScryfallLike;
  showCaption?: boolean;
  eager?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const { front, back } = getCardImages(card);

  return (
    <div className="group relative">
      <Link
        href={`/card/cardId/${encodeURIComponent(card.id)}`}
        className="block rounded-[4.75%/3.4%] focus-visible:outline-offset-4"
      >
        <div className="mtg-card">
          {front ? (
            <>
              <img
                src={front}
                alt={card.name}
                width={488}
                height={680}
                loading={eager ? 'eager' : 'lazy'}
                decoding="async"
                className={cn(
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                  flipped && back && 'opacity-0',
                )}
              />
              {back && (
                <img
                  src={back}
                  alt={`${card.name} (verso)`}
                  width={488}
                  height={680}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                    !flipped && 'opacity-0',
                  )}
                />
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
              <p className="font-display text-sm font-semibold">{card.name}</p>
              <p className="text-xs text-muted-foreground">Sem imagem</p>
            </div>
          )}
        </div>
        {showCaption && (
          <div className="mt-3 px-0.5">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {card.name}
            </p>
            {card.type_line && (
              <p className="truncate text-xs text-muted-foreground">{card.type_line}</p>
            )}
          </div>
        )}
      </Link>

      {back && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Mostrar frente' : 'Mostrar verso'}
          aria-pressed={flipped}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-background/80 text-foreground shadow-lg backdrop-blur hover:border-primary hover:text-primary"
        >
          <RotateCcw
            className={cn('h-4 w-4 transition-transform duration-300', flipped && '-rotate-180')}
          />
        </button>
      )}
    </div>
  );
}

export function CardTileSkeleton({ showCaption = true }: { showCaption?: boolean }) {
  return (
    <div aria-hidden>
      <div className="aspect-[63/88] animate-pulse rounded-[4.75%/3.4%] bg-white/[0.04]" />
      {showCaption && (
        <div className="mt-3 space-y-1.5 px-0.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
        </div>
      )}
    </div>
  );
}
