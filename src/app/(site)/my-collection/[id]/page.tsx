import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import { getSetCollection } from '@/app/actions/setCollectionActions';
import SetCollectionDetailClient from './SetCollectionDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { collection } = await getSetCollection(id);
  return {
    title: collection
      ? `${collection.set_name} — Minha Coleção | DeckSage`
      : 'Coleção | DeckSage',
  };
}

export default async function SetCollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { collection, cards, isOwner, error } = await getSetCollection(id);

  if (!collection) {
    if (error === 'Coleção privada' && !user) {
      redirect(`/login?next=/my-collection/${id}`);
    }
    notFound();
  }

  return (
    <SetCollectionDetailClient collection={collection} cards={cards} isOwner={isOwner} />
  );
}
