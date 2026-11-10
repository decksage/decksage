import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import NewSetCollectionClient from './NewSetCollectionClient';

export const metadata = {
  title: 'Nova Coleção por Edição | DeckSage',
};

export const dynamic = 'force-dynamic';

export default async function NewSetCollectionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/my-collection/new');
  }

  return <NewSetCollectionClient />;
}
