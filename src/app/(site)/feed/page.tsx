import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Rss } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Feed | DeckSage' };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/feed');

  const { data: follows } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', user.id);
  const followeeIds = (follows ?? []).map((f) => f.followee_id).filter(Boolean);

  let decks: { id: string; name: string; format: string; created_at: string; user_id: string }[] =
    [];
  let nextCursor: string | null = null;
  let mode: 'following' | 'trending' = 'following';

  if (followeeIds.length > 0) {
    let q = supabase
      .from('decks')
      .select('id, name, format, created_at, user_id')
      .in('user_id', followeeIds)
      .eq('is_public', true)
      .eq('owner_type', 'user')
      .order('created_at', { ascending: false })
      .limit(21);
    if (cursor) q = q.lt('created_at', cursor);
    const { data } = await q;
    decks = data ?? [];
    if (decks.length > 20) {
      nextCursor = decks[20].created_at;
      decks = decks.slice(0, 20);
    }
  }

  if (followeeIds.length === 0 || decks.length === 0) {
    mode = 'trending';
    const { data: trend } = await supabase
      .from('trending_decks_weekly')
      .select('decks(id, name, format, created_at, user_id)')
      .order('week_start', { ascending: false })
      .order('rank', { ascending: true })
      .limit(30);
    decks =
      (trend ?? [])
        .map((t: any) => t.decks)
        .filter(Boolean)
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          format: d.format,
          created_at: d.created_at,
          user_id: d.user_id,
        })) ?? [];
  }

  const authorIds = [...new Set(decks.map((d) => d.user_id))];
  let authorMap = new Map<string, string>();
  if (authorIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', authorIds);
    authorMap = new Map(
      (profs ?? []).map((p) => [p.id, (p.full_name || p.username || 'Jogador') as string]),
    );
  }

  return (
    <>
      <PageHeader
        kicker="Sua rede"
        title="Feed"
        description={
          mode === 'following'
            ? 'Decks públicos de quem você segue, do mais recente ao mais antigo.'
            : 'Você ainda não segue ninguém. Enquanto isso, estas são as tendências da semana.'
        }
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        {decks.length === 0 ? (
          <EmptyState
            icon={Rss}
            title="Nada para mostrar"
            description="Siga jogadores em Explorar para montar o seu feed."
            action={{ href: '/explore', label: 'Explorar decks' }}
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {decks.map((d) => (
              <li key={d.id}>
                <Link href={`/decksage/${d.id}`} className="group block py-5">
                  <p className="kicker">{d.format}</p>
                  <h2 className="mt-1.5 text-lg font-semibold group-hover:text-primary">
                    {d.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {authorMap.get(d.user_id) ?? 'Jogador'}
                    {d.created_at && (
                      <>
                        {' · '}
                        <time dateTime={d.created_at}>
                          {new Date(d.created_at).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </time>
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {mode === 'following' && nextCursor && (
          <div className="mt-8">
            <Link
              href={`/feed?cursor=${encodeURIComponent(nextCursor)}`}
              className="inline-flex h-11 items-center rounded-md border border-white/15 px-5 text-sm font-semibold hover:border-primary/60"
            >
              Carregar mais
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
