/* eslint-disable no-undef */
import Link from 'next/link';
import { MessageSquare, Trophy } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rankings | DeckSage',
  description: 'Criadores com mais decks públicos e quem mais comentou neste mês.',
};

function Board({
  id,
  title,
  rows,
  empty,
}: {
  id: string;
  title: string;
  rows: { key: string; name: string; href?: string; stat: string }[];
  empty: string;
}) {
  return (
    <section aria-labelledby={id} className="frame p-6 [--cut:14px] sm:p-8">
      <h2 id={id} className="kicker mb-6">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol>
          {rows.map((row, i) => (
            <li
              key={row.key}
              className="flex items-baseline gap-4 border-b border-white/5 py-3.5 last:border-0"
            >
              <span className="w-8 font-display text-2xl font-bold leading-none text-primary/60 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              {row.href ? (
                <Link
                  href={row.href}
                  className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                >
                  {row.name}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
              )}
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {row.stat}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function LeaderboardsPage() {
  const supabase = createClient();
  const [{ data: creators }, { data: commenters }] = await Promise.all([
    supabase.rpc('leaderboard_public_deck_counts', { p_limit: 20 }),
    supabase.rpc('leaderboard_monthly_commenters', { p_limit: 20 }),
  ]);

  return (
    <>
      <PageHeader
        kicker="Comunidade"
        title="Rankings"
        description="Quem mais publica decks e quem mais conversa nos comentários neste mês."
        className="border-b-0"
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 lg:grid-cols-2">
        <Board
          id="criadores"
          title="Decks públicos"
          empty="Ainda não há criadores no ranking."
          rows={(creators ?? []).map((row: any) => ({
            key: row.author_id,
            name: row.display_name,
            stat:
              `${row.public_decks} ${row.public_decks === 1 ? 'deck' : 'decks'}` +
              (row.reputation_points > 0 ? ` · ${row.reputation_points} rep` : ''),
          }))}
        />
        <Board
          id="comentarios"
          title="Comentários do mês"
          empty="Sem comentários registrados neste mês."
          rows={(commenters ?? []).map((row: any) => ({
            key: row.user_id,
            name: row.display_name,
            stat: `${row.comment_count} comentários`,
          }))}
        />
        {!creators?.length && !commenters?.length && (
          <div className="lg:col-span-2">
            <EmptyState icon={creators ? MessageSquare : Trophy} title="Rankings ainda vazios" />
          </div>
        )}
      </div>
    </>
  );
}
