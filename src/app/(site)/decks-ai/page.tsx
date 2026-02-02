/* eslint-disable no-undef */
/* eslint-disable no-console */
import { createClient } from '@/app/utils/supabase/server';
import DeckFilters from './components/DeckFilters';
import DeckCard from './components/DeckCard';
import PaginationControls from './components/PaginationControls';

export const metadata = {
  title: 'Biblioteca de Decks | MTG Deck Builder',
  description: 'Explore decks de Magic: The Gathering para diversos formatos, criados e analisados pela nossa comunidade e equipe.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: { format?: string; page?: string; }
}

export default async function DecksPage(props: any) {
  const { searchParams } = props as PageProps;
  const supabase = createClient();

  const formatFilter = searchParams?.format || '';
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 12;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: decks, error } = await supabase.rpc('search_public_site_decks', {
    format_filter: formatFilter,
    page_size: ITEMS_PER_PAGE,
    page_offset: offset
  });

  if (error) {
    console.error("Erro ao buscar decks do site:", error);
  }

  // Busca decks da comunidade (públicos e com perfil do usuário)
  /* O filtro de formato será aplicado aqui também se necessário.
     Considerando que o RPC já traz os dados formatados, vamos tentar manter a estrutura.
     Mas para a comunidade, vamos buscar direto da tabela 'decks'.
  */

  let query = supabase
    .from('decks')
    .select(`
      id,
      name,
      format,
      representative_card_image_url,
      color_identity,
      user_profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(ITEMS_PER_PAGE); // Por enquanto limitamos a home

  if (formatFilter) {
    query = query.eq('format', formatFilter);
  }

  const { data: communityDecks, error: communityError } = await query;

  if (communityError) {
    console.error("Erro ao buscar decks da comunidade:", communityError);
  }

  const totalItems = decks?.[0]?.total_count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-amber-500 tracking-tight">Biblioteca de Decks</h1>
          <p className="text-lg text-neutral-400 mt-2 max-w-2xl mx-auto">
            Explore dezenas de decks para todos os formatos, criados pela nossa IA e pela comunidade.
          </p>
        </header>

        <DeckFilters />

        <div className="space-y-16">
          {/* Seção Decks da IA */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-500">🤖</span> Decks da IA
            </h2>
            {decks && decks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {decks.map((deck: any) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
                <p className="text-neutral-400">Nenhum deck da IA encontrado para este filtro.</p>
              </div>
            )}
          </section>

          {/* Seção Decks da Comunidade */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-500">👥</span> Decks da Comunidade
            </h2>

            {communityDecks && communityDecks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {communityDecks.map((deck: any) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
                <p className="text-neutral-400">Nenhum deck da comunidade encontrado ainda. Seja o primeiro a publicar!</p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-12">
          <PaginationControls
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
}