import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Layers, Paintbrush } from 'lucide-react';
import AdSlot from '@/app/(site)/components/ads/AdSlot';
import type { ScryfallCard } from '@/app/lib/types';
import { translateCardText } from '@/app/actions/aiActions';
import ManaCost from '@/components/ui/ManaCost';
import { cn } from '@/lib/utils';
import CardArt from './CardArt';
import CardLegalities from './CardLegalities';
import CardTextDisplay, { CardTextSkeleton } from './CardTextDisplay';

type Face = {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  image_uris?: { large?: string; normal?: string; art_crop?: string };
};

const RARITY: Record<string, { label: string; dot: string }> = {
  common: { label: 'Comum', dot: 'bg-neutral-400' },
  uncommon: { label: 'Incomum', dot: 'bg-slate-300' },
  rare: { label: 'Rara', dot: 'bg-amber-400' },
  mythic: { label: 'Mítica', dot: 'bg-orange-500' },
  special: { label: 'Especial', dot: 'bg-fuchsia-400' },
  bonus: { label: 'Bônus', dot: 'bg-fuchsia-400' },
};

async function TranslatedText({ cardId, face }: { cardId: string; face: Face }) {
  const result = await translateCardText(cardId, face.name, face.oracle_text ?? '');
  return <CardTextDisplay originalText={face.oracle_text} translatedText={result.translatedText} />;
}

function FaceDetails({ cardId, face, isBack }: { cardId: string; face: Face; isBack?: boolean }) {
  const stats =
    face.power != null && face.toughness != null
      ? `${face.power}/${face.toughness}`
      : face.loyalty != null
        ? `Lealdade ${face.loyalty}`
        : null;

  return (
    <section className={cn(isBack && 'border-t border-white/10 pt-10')}>
      {isBack ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            {face.name}
          </h2>
          <ManaCost cost={face.mana_cost} fontSize="1.35rem" />
        </div>
      ) : null}
      {face.type_line && (
        <p
          className={cn(
            'font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground',
            isBack && 'mt-2',
          )}
        >
          {face.type_line}
        </p>
      )}

      {face.oracle_text && (
        <div className="frame mt-6 p-6 [--frame-border:color-mix(in_oklch,var(--primary)_35%,transparent)] sm:p-7">
          {isBack ? (
            // A tabela card_translations guarda uma tradução por carta, não por face.
            <CardTextDisplay originalText={face.oracle_text} translatedText={null} />
          ) : (
            <Suspense fallback={<CardTextSkeleton />}>
              <TranslatedText cardId={cardId} face={face} />
            </Suspense>
          )}
          {face.flavor_text && (
            <p className="mt-5 border-t border-white/10 pt-5 font-serif text-base italic leading-relaxed text-muted-foreground">
              {face.flavor_text}
            </p>
          )}
        </div>
      )}

      {stats && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-4 py-2 font-display text-xl font-bold tabular-nums">
          {stats}
        </p>
      )}
    </section>
  );
}

export default function CardDetailView({ card }: { card: ScryfallCard }) {
  const faces: Face[] = card.card_faces?.length ? card.card_faces : [card];
  const front = faces[0];
  const hasFaceImages = !card.image_uris && faces.every((f) => f.image_uris);

  const images = hasFaceImages
    ? faces.map((f) => f.image_uris?.large || f.image_uris?.normal || '').filter(Boolean)
    : [card.image_uris?.large || card.image_uris?.normal || ''].filter(Boolean);
  const artCrop = card.image_uris?.art_crop ?? front.image_uris?.art_crop;
  const rarity = RARITY[card.rarity] ?? { label: card.rarity, dot: 'bg-neutral-400' };
  const manaCost = faces.length > 1 ? front.mana_cost : (card.mana_cost ?? front.mana_cost);

  return (
    <div className="relative isolate overflow-hidden">
      {artCrop && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden">
          <img
            src={artCrop}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-25 blur-3xl saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
        </div>
      )}

      <div className="container mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-10">
        <Link
          href="/search"
          className="rise inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Buscar cartas
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-14">
          <div className="rise mx-auto w-full max-w-sm lg:sticky lg:top-[calc(var(--header-offset)+1.5rem)] lg:max-w-none lg:self-start">
            <CardArt images={images} name={card.name} />
          </div>

          <div className="min-w-0">
            <header className="rise [--delay:80ms]">
              <p className="kicker flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', rarity.dot)} />
                  {rarity.label}
                </span>
                <span aria-hidden className="text-white/20">
                  /
                </span>
                <span className="truncate">{card.set_name}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-5xl">
                  {faces.length > 1 ? front.name : card.name}
                </h1>
                <ManaCost cost={manaCost} fontSize="1.6rem" className="pt-1" />
              </div>
            </header>

            <div className="rise mt-4 space-y-10 [--delay:140ms]">
              {faces.map((face, i) => (
                <FaceDetails
                  key={`${face.name}-${i}`}
                  cardId={card.id}
                  face={face}
                  isBack={i > 0}
                />
              ))}

              <CardLegalities legalities={card.legalities} />

              <AdSlot placement="card" />

              <section aria-labelledby="edicao" className="border-t border-white/10 pt-8">
                <h2 id="edicao" className="kicker mb-4">
                  Edição
                </h2>
                <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Coleção</dt>
                    <dd className="mt-1">
                      <Link
                        href={`/collections/${card.set}`}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-primary"
                      >
                        <Layers className="h-4 w-4 text-primary" />
                        {card.set_name}
                        <span className="uppercase text-muted-foreground">({card.set})</span>
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Número</dt>
                    <dd className="mt-1 font-medium tabular-nums">#{card.collector_number}</dd>
                  </div>
                  {card.artist && (
                    <div>
                      <dt className="text-muted-foreground">Ilustração</dt>
                      <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                        <Paintbrush className="h-4 w-4 text-primary" />
                        {card.artist}
                      </dd>
                    </div>
                  )}
                </dl>
                <a
                  href={card.scryfall_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Ver no Scryfall
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
