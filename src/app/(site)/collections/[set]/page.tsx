import CollectionDetailView from './CollectionDetailView';

interface PageProps {
  params: Promise<{ set: string }>;
}

export default async function SetPage({ params }: PageProps) {
  const { set } = await params;

  // Fetch Set Info
  const setInfoRes = await fetch(`https://api.scryfall.com/sets/${set}`);
  const setInfo = await setInfoRes.json();

  // Fetch Initial Cards (default query)
  const cardsRes = await fetch(`https://api.scryfall.com/cards/search?q=e:${set}&order=set`);
  const cardsData = await cardsRes.json();

  return (
    <CollectionDetailView
      setInfo={setInfo}
      initialCards={cardsData.data || []}
      setCode={set}
    />
  );
}
