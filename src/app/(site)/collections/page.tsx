import CollectionsView from './CollectionsView';

export const metadata = {
  title: 'Coleções de Magic: The Gathering | MTG Brasil',
  description:
    'Explore todas as coleções, edições e sets de Magic: The Gathering. Filtre por ano, tipo e encontre cartas específicas.',
};

export const revalidate = 86400; // Cache for 24 hours

export default async function CollectionsPage() {
  const res = await fetch('https://api.scryfall.com/sets');
  const data = await res.json();

  const sets = data.data.filter((set: any) => set.set_type !== 'funny' && set.digital === false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <CollectionsView sets={sets} />
    </div>
  );
}
