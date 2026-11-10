import { Suspense } from 'react';
import SearchClientContent, { SearchResultsSkeleton } from './components/SearchClientContent';
import AdSlot from '@/app/(site)/components/ads/AdSlot';

export const metadata = {
  title: 'Buscar cartas de Magic | DeckSage',
  description:
    'Busque cartas de Magic: The Gathering em qualquer idioma e veja o texto em português.',
};

export default function SearchPageContainer() {
  return (
    <>
      <AdSlot placement="search" className="mx-auto max-w-7xl px-6 pt-6" />
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchClientContent />
      </Suspense>
    </>
  );
}
