'use client';

import { useState, useMemo } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ManaCost from '@/components/ui/ManaCost';
import type { DeckFromDB, ScryfallCard } from '@/app/lib/types';

interface Props {
  deck: DeckFromDB;
  scryfallData: ScryfallCard[];
}

interface CardWithCount {
  card: ScryfallCard;
  count: number;
  groupType: string;
}

const typeOrder = [
  'Commander',
  'Planeswalker',
  'Creature',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Battle',
  'Land',
  'Sideboard',
  'Other',
];

const typeTranslations: Record<string, string> = {
  Commander: 'Comandante',
  Planeswalker: 'Planeswalkers',
  Creature: 'Criaturas',
  Instant: 'Mágicas Instantâneas',
  Sorcery: 'Feitiços',
  Artifact: 'Artefatos',
  Enchantment: 'Encantamentos',
  Battle: 'Batalhas',
  Land: 'Terrenos',
  Sideboard: 'Sideboard',
  Other: 'Outros',
};

function cardImage(card: ScryfallCard): string {
  return card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
}

const DecklistVisualizer = ({ deck, scryfallData }: Props) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

  const scryfallMap = useMemo(() => {
    const map = new Map<string, ScryfallCard>();
    for (const card of scryfallData) {
      for (const name of [card.name, card.name.split(' // ')[0], card.card_faces?.[0]?.name]) {
        if (name) map.set(name.toLowerCase(), card);
      }
    }
    return map;
  }, [scryfallData]);

  const groupedAndSortedCards = useMemo(() => {
    const { commander, mainboard, sideboard } = deck.decklist;
    const allCards: { name: string; count: number; groupType: string }[] = [
      ...(commander?.map((c) => ({ ...c, groupType: 'Commander' })) || []),
      ...(mainboard?.map((c) => ({ ...c, groupType: 'Mainboard' })) || []),
      ...(sideboard?.map((c) => ({ ...c, groupType: 'Sideboard' })) || []),
    ];

    const withData: CardWithCount[] = allCards
      .map(({ name, count, groupType }) => {
        const card = scryfallMap.get(name.toLowerCase());
        if (!card) return null;
        let finalType = 'Other';
        if (groupType === 'Commander') finalType = 'Commander';
        else if (groupType === 'Sideboard') finalType = 'Sideboard';
        else {
          const typeLine = (card.card_faces?.[0]?.type_line || card.type_line || '').split('//')[0];
          finalType = typeOrder.find((type) => typeLine.includes(type)) || 'Other';
        }
        return { card, count, groupType: finalType };
      })
      .filter((c): c is CardWithCount => c !== null);

    const groups: Record<string, CardWithCount[]> = {};
    for (const card of withData) {
      if (!groups[card.groupType]) groups[card.groupType] = [];
      groups[card.groupType].push(card);
    }
    for (const type in groups) {
      groups[type].sort((a, b) => a.card.name.localeCompare(b.card.name));
    }
    return groups;
  }, [deck.decklist, scryfallMap]);

  const curve = useMemo(() => {
    const bins = Array.from({ length: 8 }, () => 0);
    for (const group of Object.values(groupedAndSortedCards)) {
      for (const item of group) {
        if (item.groupType === 'Land' || item.groupType === 'Sideboard') continue;
        bins[Math.min(7, Math.floor(item.card.cmc || 0))] += item.count;
      }
    }
    return bins;
  }, [groupedAndSortedCards]);

  const curveMax = Math.max(1, ...curve);
  const totalCards = Object.values(groupedAndSortedCards)
    .flat()
    .reduce((sum, item) => sum + item.count, 0);
  const preview = selectedCard ?? Object.values(groupedAndSortedCards)[0]?.[0]?.card ?? null;

  return (
    <section id="decklist" className="scroll-mt-32">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Decklist</p>
          <h2 className="mt-2 font-display text-2xl uppercase tracking-wide">
            {totalCards} cartas
          </h2>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="Ver em lista"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Ver em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">Curva de mana, sem terrenos</p>
      <div className="mt-2 flex items-end gap-1.5" aria-hidden>
        {curve.map((count, cmc) => (
          <div key={cmc} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{count || ''}</span>
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${count === 0 ? 2 : Math.max(12, (count / curveMax) * 72)}px` }}
            />
            <span className="text-[10px] text-muted-foreground">{cmc === 7 ? '7+' : cmc}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <div className="mx-auto w-52 self-start sm:w-64 lg:sticky lg:top-[calc(var(--header-offset)+3.5rem)] lg:mx-0 lg:w-auto">
          {preview && cardImage(preview) ? (
            <>
              <img src={cardImage(preview)} alt={preview.name} className="mtg-card w-full object-cover" />
              <p className="mt-3 text-center font-display text-sm uppercase tracking-wide">
                {preview.card_faces?.[0]?.name || preview.name}
              </p>
            </>
          ) : (
            <div className="mtg-card grid w-full place-items-center bg-card text-sm text-muted-foreground">
              Passe o mouse sobre uma carta
            </div>
          )}
        </div>

        {viewMode === 'list' ? (
          <div className="grid content-start gap-x-10 gap-y-8 sm:grid-cols-2">
            {typeOrder.map((type) => {
              const cards = groupedAndSortedCards[type];
              if (!cards) return null;
              const count = cards.reduce((sum, c) => sum + c.count, 0);
              return (
                <div key={type}>
                  <h3 className="kicker">
                    {typeTranslations[type]} ({count})
                  </h3>
                  <ul className="mt-2">
                    {cards.map(({ card, count: copies }) => (
                      <li key={card.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedCard(card)}
                          onClick={() => setSelectedCard(card)}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted ${
                            preview?.id === card.id ? 'bg-muted' : ''
                          }`}
                        >
                          <span className="w-7 shrink-0 font-display tabular-nums text-primary">
                            {copies}×
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {card.card_faces?.[0]?.name || card.name}
                          </span>
                          <ManaCost
                            cost={card.mana_cost || card.card_faces?.[0]?.mana_cost}
                            fontSize="0.85rem"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
            {Object.entries(groupedAndSortedCards).flatMap(([type, cards]) =>
              cards.map(({ card, count }) => (
                <button
                  key={`${type}-${card.id}`}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="group relative text-left"
                >
                  {cardImage(card) ? (
                    <img
                      src={cardImage(card)}
                      alt={card.name}
                      className="mtg-card w-full transition-transform duration-300 group-hover:-translate-y-1"
                    />
                  ) : (
                    <div className="mtg-card grid w-full place-items-center bg-card p-2 text-center text-xs">
                      {card.name}
                    </div>
                  )}
                  <span className="absolute right-1 top-1 rounded bg-background/90 px-1.5 font-display text-xs text-primary">
                    {count}×
                  </span>
                </button>
              )),
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DecklistVisualizer;
