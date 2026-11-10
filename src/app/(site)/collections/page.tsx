import CollectionsView from './CollectionsView';
import { fetchAllScryfallSets } from '@/app/lib/scryfall';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Coleções de Magic: The Gathering | MTG Brasil',
  description:
    'Explore todas as coleções, edições e sets de Magic: The Gathering. Filtre por ano, tipo e encontre cartas específicas.',
};

export const revalidate = 86400;

export default async function CollectionsPage() {
  let sets: Awaited<ReturnType<typeof fetchAllScryfallSets>> = [];
  let loadError: string | null = null;

  try {
    sets = await fetchAllScryfallSets();
  } catch (error) {
    console.error('Erro ao buscar edições do Scryfall:', error);
    loadError = 'Não foi possível carregar as edições. Tente novamente em instantes.';
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {loadError && (
        <div className="container mx-auto px-4 pt-6 max-w-7xl">
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {loadError}
          </div>
        </div>
      )}
      <CollectionsView sets={sets} />
    </div>
  );
}
