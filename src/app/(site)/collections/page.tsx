/* eslint-disable no-undef */
/* eslint-disable no-console */
import { AlertCircle, Layers } from 'lucide-react';
import CollectionsView from './CollectionsView';
import { fetchAllScryfallSets } from '@/app/lib/scryfall';
import PageHeader, { MetaChip } from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const metadata = {
  title: 'Coleções de Magic: The Gathering | MTG Brasil',
  description:
    'Explore todas as coleções, edições e sets de Magic: The Gathering. Filtre por ano, tipo e encontre cartas específicas.',
};

export const revalidate = 86400;

export default async function CollectionsPage() {
  let sets: Awaited<ReturnType<typeof fetchAllScryfallSets>> = [];
  let loadError = false;

  try {
    sets = await fetchAllScryfallSets();
  } catch (error) {
    console.error('Erro ao buscar edições do Scryfall:', error);
    loadError = true;
  }

  return (
    <>
      <PageHeader
        kicker="Arquivo de edições"
        title="Coleções"
        description="Todas as edições de Magic, de Alpha ao lançamento mais recente. Filtre por nome, sigla, ano ou tipo."
        meta={
          sets.length > 0 && (
            <MetaChip icon={Layers}>
              <span className="font-semibold text-foreground tabular-nums">{sets.length}</span>{' '}
              edições
            </MetaChip>
          )
        }
        className="border-b-0"
      />
      {loadError ? (
        <div className="mx-auto max-w-7xl px-6 pb-20">
          <EmptyState
            tone="error"
            icon={AlertCircle}
            title="Não foi possível carregar as edições"
            description="O Scryfall não respondeu agora. Tente novamente em instantes."
          />
        </div>
      ) : (
        <CollectionsView sets={sets} />
      )}
    </>
  );
}
