/* eslint-disable no-undef */
/* eslint-disable no-console */
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/app/utils/supabase/server';
import { fetchCardsByNames } from '@/app/lib/scryfall';
import DynamicAdSlot from '@/app/(site)/components/ads/DynamicAdSlot';

// Definindo interfaces claras para os dados
interface DeckCard {
  name: string;
  count: number;
}

interface Decklist {
  mainboard: DeckCard[];
  sideboard?: DeckCard[];
}

// O tipo de dados que esperamos do Supabase
interface DeckFromDB {
  deck_id: string;
  name: string;
  format: 'commander' | 'pauper' | 'modern';
  representative_card_name: string;
  representative_card_image_url: string;
  decklist: Decklist;
  price: number | null;
  strategy: string | null;
  created_at: string;
}

// Tipagem para os params da página dinâmica
interface DeckPageProps {
  params: Promise<{
    format: 'commander' | 'pauper' | 'modern';
    id: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { format, id } = await params; // Desestrutura params como Promise

  // Cria uma instância do cliente Supabase para esta requisição no servidor
  const supabase = createClient();

  // Buscar o deck e a config de anúncios em paralelo
  const [{ data: deck, error }, { data: adConfig }] = await Promise.all([
    supabase
      .from('daily_decks')
      .select<'*', DeckFromDB>('*')
      .eq('deck_id', id)
      .eq('format', format)
      .single(),
    supabase
      .from('ad_slots')
      .select('*')
      .eq('slot_name', 'banner_deck') // Nome do slot para decks
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (error || !deck) {
    console.error(`Erro ao buscar deck (ID: ${id}, Formato: ${format}):`, error);
    notFound();
  }

  // Preparar lista de nomes de cartas únicas para buscar imagens
  const cardNames = [
    ...deck.decklist.mainboard.map((card) => card.name),
    ...(deck.decklist.sideboard?.map((card) => card.name) || []),
  ];

  // Buscar imagens das cartas no Scryfall
  const cardsData = await fetchCardsByNames(cardNames);
  const cardImageMap = cardsData.reduce((map, card) => {
    if (card && card.name) {
      map.set(
        card.name,
        card.image_uris?.normal ||
          `https://placehold.co/265x370/171717/EAB308?text=${encodeURIComponent(card.name)}`,
      );
    }
    return map;
  }, new Map<string, string>());

  const sections = [
    { title: 'Mainboard', cards: deck.decklist.mainboard },
    { title: 'Sideboard', cards: deck.decklist.sideboard ?? [] },
  ].filter((section) => section.cards.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
      <p className="kicker">{deck.format}</p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
        {deck.name}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        R$ {(deck.price ?? 0).toFixed(2)} ·{' '}
        {new Date(deck.created_at).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      <div className="my-8 flex justify-center">
        <DynamicAdSlot adConfig={adConfig} />
      </div>

      <div className="flex flex-col items-start gap-8 sm:flex-row">
        <div className="mtg-card w-48 shrink-0 sm:w-56">
          <Image
            src={deck.representative_card_image_url}
            alt={deck.representative_card_name}
            fill
            unoptimized
            preload
            className="object-cover"
            sizes="224px"
          />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">
            {deck.representative_card_name}
          </h2>
          {deck.strategy && (
            <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
              {deck.strategy}
            </p>
          )}
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-bold uppercase tracking-tight">
            {section.title}{' '}
            <span className="text-base text-muted-foreground tabular-nums">
              ({section.cards.reduce((sum, card) => sum + card.count, 0)})
            </span>
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {section.cards.map((card, index) => (
              <li key={`${card.name}-${index}`} className="group relative">
                <div className="mtg-card">
                  <Image
                    src={
                      cardImageMap.get(card.name) ||
                      `https://placehold.co/265x370/171717/EAB308?text=${encodeURIComponent(card.name)}`
                    }
                    alt={card.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-sm font-medium">
                  <span className="tabular-nums text-primary">{card.count}×</span> {card.name}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
