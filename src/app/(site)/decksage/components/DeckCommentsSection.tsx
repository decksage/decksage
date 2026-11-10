import type { ReactNode } from 'react';
import { createClient } from '@/app/utils/supabase/server';
import DeckCommentForm from './DeckCommentForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeJoinedProfile } from '@/lib/supabase-profile';

export default async function DeckCommentsSection({
  deckId,
  isPublic,
  actions,
}: {
  deckId: string;
  isPublic: boolean;
  actions?: ReactNode;
}) {
  if (!isPublic) return null;

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('deck_comments')
    .select(
      'id, content, created_at, parent_id, user_id, profiles(username, full_name, avatar_url)',
    )
    .eq('deck_id', deckId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const topLevel = (rows ?? []).filter((r) => !r.parent_id);
  const replies = (rows ?? []).filter((r) => r.parent_id);

  return (
    <section id="comments" className="scroll-mt-32 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Comunidade</p>
          <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
            Comentários
          </h2>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <DeckCommentForm deckId={deckId} />

      <ul className="space-y-4">
        {topLevel.map((c) => {
          const p = normalizeJoinedProfile(c.profiles);
          const name = p?.full_name || p?.username || 'Jogador';
          const childReplies = replies.filter((r) => r.parent_id === c.id);
          return (
            <li key={c.id} className="rounded-lg border border-white/10 bg-card p-4">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="font-semibold text-primary">{name}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-foreground mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
                  <div className="mt-3">
                    <DeckCommentForm deckId={deckId} parentId={c.id} compact />
                  </div>
                  {childReplies.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l border-white/15 pl-4">
                      {childReplies.map((r) => {
                        const rp = normalizeJoinedProfile(r.profiles);
                        const rname = rp?.full_name || rp?.username || 'Jogador';
                        return (
                          <li key={r.id} className="text-sm">
                            <span className="font-medium text-primary/90">{rname}</span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {new Date(r.created_at).toLocaleString('pt-BR')}
                            </span>
                            <p className="text-foreground/80 mt-1 whitespace-pre-wrap">{r.content}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {topLevel.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro.</p>
      )}
    </section>
  );
}
