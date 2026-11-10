import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/app/utils/supabase/server';
import { fetchScryfallSetByCode, scryfallFetch } from '@/app/lib/scryfall';
import { getMyCollectionForSet } from '@/app/actions/setCollectionActions';
import CollectionDetailView from './CollectionDetailView';

interface PageProps {
  params: Promise<{ set: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { set } = await params;
  const setInfo = await fetchScryfallSetByCode(set.trim().toLowerCase());
  return setInfo
    ? { title: `${setInfo.name} (${setInfo.code.toUpperCase()}) | Coleções` }
    : { title: 'Coleção não encontrada' };
}

async function fetchFirstPage(setCode: string) {
  const res = await scryfallFetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`e:${setCode}`)}&order=set`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return { data: [], next_page: null };
  const json = await res.json();
  return { data: json.data ?? [], next_page: json.has_more ? (json.next_page as string) : null };
}

export default async function SetPage({ params }: PageProps) {
  const { set } = await params;
  const setCode = set.trim().toLowerCase();
  const supabase = createClient();

  const [setInfo, firstPage, auth, mine] = await Promise.all([
    fetchScryfallSetByCode(setCode),
    fetchFirstPage(setCode),
    supabase.auth.getUser(),
    getMyCollectionForSet(setCode),
  ]);

  if (!setInfo) notFound();

  return (
    <CollectionDetailView
      setInfo={{
        name: setInfo.name,
        released_at: setInfo.released_at,
        card_count: setInfo.card_count ?? 0,
        icon_svg_uri: setInfo.icon_svg_uri,
      }}
      initialCards={firstPage.data}
      initialNextPage={firstPage.next_page}
      setCode={setCode}
      existingCollectionId={mine.collectionId}
      isAuthenticated={!!auth.data.user}
    />
  );
}
