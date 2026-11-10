/* eslint-disable no-console */
/* eslint-disable no-undef */
import { createClient } from '@/app/utils/supabase/server';
import { notFound } from 'next/navigation';
import type { ScryfallCard, DeckFromDB } from '@/app/lib/types';
import { fetchCardsByNames } from '@/app/lib/scryfall';

import DeckHeader from '../components/DeckHeader';
import DeckPageNav from '../components/DeckPageNav';
import DecklistVisualizer from '../components/DecklistVisualizer';
import DeckAnalysis from '../components/DeckAnalysis';
import HowToPlayGuide from '../components/HowToPlayGuide';
import DeckCommentsSection from '../components/DeckCommentsSection';
import DeckLikeButton from '../components/DeckLikeButton';
import ReportDialog from '@/app/(site)/components/ReportDialog';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C'];

type DeckRow = DeckFromDB & { color_identity?: string[] | null };

function orderedColors(raw: string[] | null | undefined, cards: ScryfallCard[]) {
  const source = raw?.length ? raw : [...new Set(cards.flatMap((card) => card.color_identity ?? []))];
  const known = COLOR_ORDER.filter((color) => source.includes(color));
  return known.length ? known : ['C'];
}

export default async function SiteDeckPage(props: PageProps) {
  const { id } = await props.params;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error: deckError } = await supabase.from('decks').select('*').eq('id', id).single();

  if (deckError || !data) {
    console.error('Erro ao buscar deck:', deckError);
    notFound();
  }

  const deckData = data as DeckRow;
  const isOwner = user?.id === deckData.user_id;

  if (!deckData.is_public && !isOwner) {
    notFound();
  }

  const cardEntries = [
    ...(deckData.decklist.commander || []),
    ...deckData.decklist.mainboard,
    ...(deckData.decklist.sideboard || []),
  ];
  const cardNames = [...new Set(cardEntries.map((card) => String(card.name)))];

  const [authorResult, scryfallCards, savedResult, likeResult, userLikeResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .eq('id', deckData.user_id)
      .single(),
    fetchCardsByNames(cardNames),
    user
      ? supabase
          .from('saved_decks')
          .select('deck_id')
          .eq('user_id', user.id)
          .eq('deck_id', deckData.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('deck_likes')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckData.id),
    user
      ? supabase
          .from('deck_likes')
          .select('deck_id')
          .eq('user_id', user.id)
          .eq('deck_id', deckData.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const author = authorResult.data;
  const deck: DeckFromDB = { ...deckData, author };
  const cardCount = cardEntries.reduce((sum, card) => sum + (Number(card.count) || 0), 0);
  const colors = orderedColors(deckData.color_identity, scryfallCards);
  const art =
    deck.representative_card_image_url ||
    scryfallCards.find((card) => card.image_uris?.art_crop)?.image_uris?.art_crop ||
    scryfallCards.find((card) => card.card_faces?.[0]?.image_uris?.art_crop)?.card_faces?.[0]
      ?.image_uris?.art_crop ||
    null;

  return (
    <div className="relative isolate">
      {art && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] overflow-hidden">
          <img src={art} alt="" className="h-full w-full scale-110 object-cover opacity-25 blur-3xl saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <DeckHeader
          deck={deck}
          isOwner={isOwner}
          isInitiallySaved={!!savedResult.data}
          creatorProfile={author}
          colors={colors}
          cardCount={cardCount}
        />

        <DeckPageNav
          hasAnalysis={!!deck.deck_check}
          hasGuide={!!deck.how_to_play_guide}
          hasComments={!!deck.is_public}
        />

        <div className="mt-10 space-y-16">
          <DecklistVisualizer deck={deck} scryfallData={scryfallCards} />
          <DeckAnalysis deckCheck={deck.deck_check} />
          <HowToPlayGuide guideText={deck.how_to_play_guide} />
          <DeckCommentsSection
            deckId={deck.id}
            isPublic={!!deck.is_public}
            actions={
              deck.is_public ? (
                <>
                  <DeckLikeButton
                    deckId={deck.id}
                    initialCount={likeResult.count ?? 0}
                    initialLiked={!!userLikeResult.data}
                    canInteract={!!user}
                  />
                  <ReportDialog entityType="deck" entityId={deck.id} />
                </>
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}
