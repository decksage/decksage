import { createClient } from '@/app/utils/supabase/server';
import { notFound } from 'next/navigation';
import { captureServer } from '@/lib/analytics/posthog-server';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { listPublicSetCollectionsForUser } from '@/app/actions/setCollectionActions';
import ProfileHeader from './components/ProfileHeader';
import DeckCardItemShared from './components/DeckCard';
import ProfileDeckFilters from './components/ProfileDeckFilters';
import ProfileActivity from './components/ProfileActivity';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ format?: string }>;
}

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createClient();

  let profileQuery = supabase.from('profiles').select('username, full_name, id');
  profileQuery = isUUID(slug) ? profileQuery.eq('id', slug) : profileQuery.eq('username', slug);

  const { data: profile } = await profileQuery.single();

  return {
    title: `${profile?.full_name || profile?.username || 'Usuário'} | Perfil no DeckSage`,
    description: `Veja os decks e o perfil de ${profile?.full_name || profile?.username}.`,
  };
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = createClient();

  let profileQuery = supabase.from('profiles').select('*');
  profileQuery = isUUID(slug) ? profileQuery.eq('id', slug) : profileQuery.eq('username', slug);

  const { data: profile, error: profileError } = await profileQuery.single();
  if (profileError || !profile) return notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (viewer) {
    captureServer(viewer.id, AnalyticsEvents.PROFILE_VISITED, {
      profile_user_id: profile.id,
      slug,
    });
  }

  const { data: allDecks } = await supabase
    .from('decks')
    .select('format')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .eq('owner_type', 'user');

  const availableFormats = allDecks ? [...new Set(allDecks.map((d) => d.format))] : [];
  const formatFilter = query.format?.toLowerCase() || null;

  let decksQuery = supabase
    .from('decks')
    .select(
      'id, name, format, representative_card_image_url, color_identity, created_at, view_count, save_count, clone_count',
    )
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .eq('owner_type', 'user');

  if (formatFilter) {
    decksQuery = decksQuery.eq('format', formatFilter);
  }

  const { data: decks } = await decksQuery.order('updated_at', { ascending: false });

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followee_id', profile.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  let initialFollowing = false;
  if (viewer && viewer.id !== profile.id) {
    const { data: f } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', viewer.id)
      .eq('followee_id', profile.id)
      .maybeSingle();
    initialFollowing = !!f;
  }

  const { data: commentRows } = await supabase
    .from('deck_comments')
    .select('id, content, created_at, deck_id, decks(name)')
    .eq('user_id', profile.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentComments = (commentRows ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    deck_id: row.deck_id,
    deck_name: row.decks?.name ?? null,
  }));

  const { data: recentDeckRows } = await supabase
    .from('decks')
    .select('id, name, format, created_at')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .eq('owner_type', 'user')
    .order('created_at', { ascending: false })
    .limit(5);

  const publicSetCollections = await listPublicSetCollectionsForUser(profile.id);

  return (
    <div>
      <ProfileHeader
        profile={profile}
        viewerId={viewer?.id ?? null}
        initialFollowing={initialFollowing}
        followerCount={followerCount ?? 0}
        followingCount={followingCount ?? 0}
      />
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-tight">
          Decks públicos
        </h2>

        <ProfileDeckFilters
          availableFormats={availableFormats}
          activeFormat={formatFilter}
          slug={slug}
        />

        {decks && decks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {decks.map((deck) => (
              <DeckCardItemShared key={deck.id} deck={deck} creatorUsername={profile.username} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-6 py-16 text-center text-sm text-muted-foreground">
            {formatFilter
              ? `Nenhum deck público de ${formatFilter}.`
              : 'Este jogador ainda não publicou nenhum deck.'}
          </p>
        )}

        {publicSetCollections.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight">
              <Layers className="h-6 w-6 text-primary" />
              Coleções por edição
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicSetCollections.map((c) => {
                const pct =
                  c.total_cards > 0 ? Math.round((c.owned_cards / c.total_cards) * 100) : 0;
                return (
                  <Link
                    key={c.id}
                    href={`/my-collection/${c.id}`}
                    className="frame block p-4 hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {c.set_icon_svg_uri ? (
                        <img
                          src={c.set_icon_svg_uri}
                          alt=""
                          className="h-8 w-8 invert opacity-80"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{c.set_name}</p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {c.set_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="tabular-nums">
                        {c.owned_cards}/{c.total_cards} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <ProfileActivity recentComments={recentComments} recentDecks={recentDeckRows ?? []} />
      </div>
    </div>
  );
}
