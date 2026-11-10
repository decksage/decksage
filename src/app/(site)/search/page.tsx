import { Suspense } from 'react';
import SearchClientContent, { SearchResultsSkeleton } from './components/SearchClientContent';
import DynamicAdSlot from '@/app/(site)/components/ads/DynamicAdSlot';
import { createClient } from '@/app/utils/supabase/server';

export const metadata = {
  title: 'Buscar cartas de Magic | DeckSage',
  description:
    'Busque cartas de Magic: The Gathering em qualquer idioma e veja o texto em português.',
};

export default async function SearchPageContainer() {
  const supabase = createClient();

  const { data: adConfig } = await supabase
    .from('ad_slots')
    .select('*')
    .eq('slot_name', 'banner_search')
    .eq('is_active', true)
    .maybeSingle();

  return (
    <>
      {adConfig && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <DynamicAdSlot adConfig={adConfig} className="mx-auto flex justify-center" />
        </div>
      )}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchClientContent />
      </Suspense>
    </>
  );
}
