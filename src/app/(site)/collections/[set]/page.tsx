import { notFound } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import { fetchScryfallSetByCode, scryfallFetch } from '@/app/lib/scryfall';
import { getMyCollectionForSet } from '@/app/actions/setCollectionActions';
import CollectionDetailView from './CollectionDetailView';

interface PageProps {
  params: Promise<{ set: string }>;
}

export default async function SetPage({ params }: PageProps) {
  const { set } = await params;
  const setCode = set.trim().toLowerCase();

  const setInfo = await fetchScryfallSetByCode(setCode);
  if (!setInfo) {
    notFound();
  }

  const cardsRes = await scryfallFetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`e:${setCode}`)}&order=set`,
    { next: { revalidate: 3600 } },
  );
  const cardsData = cardsRes.ok ? await cardsRes.json() : { data: [] };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { collectionId } = await getMyCollectionForSet(setCode);

  return (
    <CollectionDetailView
      setInfo={{
        name: setInfo.name,
        released_at: setInfo.released_at,
        card_count: setInfo.card_count ?? 0,
        icon_svg_uri: setInfo.icon_svg_uri,
        uri: setInfo.uri,
        search_uri: setInfo.search_uri,
      }}
      initialCards={cardsData.data || []}
      setCode={setCode}
      existingCollectionId={collectionId}
      isAuthenticated={!!user}
    />
  );
}
