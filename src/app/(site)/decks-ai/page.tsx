/* eslint-disable no-undef */
/* eslint-disable no-console */
import Link from 'next/link';
import { Bot, Users } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import DeckFilters from './components/DeckFilters';
import DeckCard, { DeckGrid } from './components/DeckCard';
import PageHeader from '../components/page/PageHeader';
import Pagination from '../components/page/Pagination';
import EmptyState from '../components/page/EmptyState';

export const metadata = {
  title: 'Biblioteca de Decks | MTG Deck Builder',
  description:
    'Explore decks de Magic: The Gathering para diversos formatos, criados e analisados pela nossa comunidade e equipe.',
};

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 12;

interface PageProps {
  searchParams: Promise<{ format?: string; page?: string }>;
}

async function fetchCommunityDecks(supabase: ReturnType<typeof createClient>, format: string) {
  let query = supabase
    .from('decks')
    .select('id, name, format, representative_card_image_url, color_identity, user_id')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(ITEMS_PER_PAGE);
  if (format) query = query.eq('format', format);

  const { data: decks, error } = await query;
  if (error) {
    console.error('Erro ao buscar decks da comunidade:', error);
    return [];
  }
  if (!decks?.length) return [];

  const userIds = [...new Set(decks.map((d) => d.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return decks.map((d) => ({ ...d, creator: byId.get(d.user_id) ?? null }));
}

function SectionTitle({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2
          id={id}
          className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function DecksPage({ searchParams }: PageProps) {
  const { format = '', page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const supabase = createClient();

  const [{ data: decks, error }, communityDecks] = await Promise.all([
    supabase.rpc('search_public_site_decks', {
      format_filter: format,
      page_size: ITEMS_PER_PAGE,
      page_offset: (currentPage - 1) * ITEMS_PER_PAGE,
    }),
    currentPage === 1 ? fetchCommunityDecks(supabase, format) : Promise.resolve([]),
  ]);

  if (error) console.error('Erro ao buscar decks do site:', error);

  const totalItems = Number(decks?.[0]?.total_count) || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <PageHeader
        kicker="Biblioteca"
        title="Decks prontos"
        description="Listas montadas pela nossa IA e pela comunidade, para todos os formatos. Abra, analise e jogue."
        actions={
          <Link
            href="/ai-deck-builder"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Gerar deck com IA
          </Link>
        }
        className="border-b-0"
      >
        <div className="rise mt-8 [--delay:200ms]">
          <DeckFilters activeFormat={format} />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-20 px-6 pb-20 pt-4">
        <section aria-labelledby="decks-ia">
          <SectionTitle
            id="decks-ia"
            icon={Bot}
            title="Decks da IA"
            description="Gerados e revisados pelo nosso construtor de decks."
          />
          {decks && decks.length > 0 ? (
            <>
              <DeckGrid>
                {decks.map((deck: any) => (
                  <li key={deck.id}>
                    <DeckCard deck={deck} />
                  </li>
                ))}
              </DeckGrid>
              <Pagination
                basePath="/decks-ai"
                currentPage={currentPage}
                totalPages={totalPages}
                params={{ format: format || undefined }}
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              icon={Bot}
              title="Nenhum deck da IA neste formato"
              description="Tente outro formato ou gere um deck novo agora mesmo."
              action={{ href: '/ai-deck-builder', label: 'Gerar deck com IA' }}
            />
          )}
        </section>

        {currentPage === 1 && (
          <section aria-labelledby="decks-comunidade">
            <SectionTitle
              id="decks-comunidade"
              icon={Users}
              title="Da comunidade"
              description="Os decks públicos mais recentes dos jogadores."
            />
            {communityDecks.length > 0 ? (
              <DeckGrid>
                {communityDecks.map((deck) => (
                  <li key={deck.id}>
                    <DeckCard deck={deck} showCreator />
                  </li>
                ))}
              </DeckGrid>
            ) : (
              <EmptyState
                icon={Users}
                title="Nenhum deck da comunidade ainda"
                description="Seja o primeiro a publicar um deck neste formato."
                action={{ href: '/my-deck/create', label: 'Criar um deck' }}
              />
            )}
          </section>
        )}
      </div>
    </>
  );
}
