/* eslint-disable no-undef */
import { Flame, Sparkles, Swords } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import DeckCard, { DeckGrid } from '../decks-ai/components/DeckCard';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Explorar | DeckSage',
  description: 'Decks em alta, novidades e Commander em destaque.',
};

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="mb-6 flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight"
      >
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ExplorePage() {
  const supabase = createClient();

  const [{ data: trend }, { data: recent }, { data: commanderDecks }] = await Promise.all([
    supabase
      .from('trending_decks_weekly')
      .select(
        'like_count, rank, decks(id, name, format, representative_card_image_url, color_identity)',
      )
      .order('week_start', { ascending: false })
      .order('rank', { ascending: true })
      .limit(12),
    supabase
      .from('decks')
      .select('id, name, format, representative_card_image_url, color_identity')
      .eq('is_public', true)
      .eq('owner_type', 'user')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('decks')
      .select('id, name, format, representative_card_image_url, color_identity, view_count')
      .eq('is_public', true)
      .eq('owner_type', 'user')
      .eq('format', 'commander')
      .order('view_count', { ascending: false })
      .limit(8),
  ]);

  const trending = (trend ?? [])
    .map((row: any) => (row.decks ? { ...row.decks, like_count: row.like_count as number } : null))
    .filter(Boolean);

  return (
    <>
      <PageHeader
        kicker="Descoberta"
        title="Explorar"
        description="O que a comunidade está jogando: tendências da semana, decks recém-publicados e Commander em destaque."
        className="border-b-0"
      />
      <div className="mx-auto max-w-7xl space-y-16 px-6 pb-20">
        <Section id="em-alta" icon={Flame} title="Em alta na semana">
          {trending.length > 0 ? (
            <DeckGrid>
              {trending.map((d: any) => (
                <li key={d.id}>
                  <DeckCard deck={d} badge={d.like_count ? `${d.like_count} likes` : undefined} />
                </li>
              ))}
            </DeckGrid>
          ) : (
            <EmptyState
              icon={Flame}
              title="Ainda sem tendência desta semana"
              description="A lista é preenchida pelo recorte semanal. Enquanto isso, veja os decks mais recentes abaixo."
            />
          )}
        </Section>

        <Section id="novos" icon={Sparkles} title="Publicados agora">
          {recent && recent.length > 0 ? (
            <DeckGrid>
              {recent.map((d) => (
                <li key={d.id}>
                  <DeckCard deck={d} />
                </li>
              ))}
            </DeckGrid>
          ) : (
            <EmptyState icon={Sparkles} title="Nenhum deck público recente" />
          )}
        </Section>

        <Section id="commander" icon={Swords} title="Commander mais visto">
          {commanderDecks && commanderDecks.length > 0 ? (
            <DeckGrid>
              {commanderDecks.map((d) => (
                <li key={d.id}>
                  <DeckCard deck={d} badge={d.view_count ? `${d.view_count} views` : undefined} />
                </li>
              ))}
            </DeckGrid>
          ) : (
            <EmptyState icon={Swords} title="Nenhum deck de Commander em destaque" />
          )}
        </Section>
      </div>
    </>
  );
}
