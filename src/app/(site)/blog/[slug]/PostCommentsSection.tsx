import { createClient } from '@/app/utils/supabase/server';
import PostCommentForm from './PostCommentForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeJoinedProfile } from '@/lib/supabase-profile';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function PostCommentsSection({ postId }: { postId: string }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('post_comments')
    .select(
      'id, content, created_at, parent_id, user_id, profiles(username, full_name, avatar_url)',
    )
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const top = (rows ?? []).filter((r) => !r.parent_id);
  const replies = (rows ?? []).filter((r) => r.parent_id);
  const total = rows?.length ?? 0;

  return (
    <section aria-labelledby="comentarios" className="mt-16 border-t border-white/10 pt-12">
      <h2 id="comentarios" className="font-display text-2xl font-bold uppercase tracking-tight">
        Comentários{' '}
        {total > 0 && (
          <span className="text-base font-semibold text-muted-foreground tabular-nums">
            ({total})
          </span>
        )}
      </h2>
      <div className="mt-6">
        <PostCommentForm postId={postId} />
      </div>

      {top.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {top.map((c) => {
            const p = normalizeJoinedProfile(c.profiles);
            const name = p?.full_name || p?.username || 'Leitor';
            const children = replies.filter((r) => r.parent_id === c.id);
            return (
              <li key={c.id} className="flex gap-4">
                <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                  <AvatarImage src={p?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{name}</span>
                    <time dateTime={c.created_at} className="ml-2 text-xs text-muted-foreground">
                      {formatDate(c.created_at)}
                    </time>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">
                    {c.content}
                  </p>
                  <div className="mt-3">
                    <PostCommentForm postId={postId} parentId={c.id} compact />
                  </div>
                  {children.length > 0 && (
                    <ul className="mt-5 space-y-5 border-l border-white/10 pl-5">
                      {children.map((r) => {
                        const rp = normalizeJoinedProfile(r.profiles);
                        const rn = rp?.full_name || rp?.username || 'Leitor';
                        return (
                          <li key={r.id} className="flex gap-3">
                            <Avatar className="h-7 w-7 shrink-0 border border-white/10">
                              <AvatarImage src={rp?.avatar_url ?? undefined} alt="" />
                              <AvatarFallback className="text-xs">
                                {rn.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm">
                                <span className="font-semibold">{rn}</span>
                                <time
                                  dateTime={r.created_at}
                                  className="ml-2 text-xs text-muted-foreground"
                                >
                                  {formatDate(r.created_at)}
                                </time>
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                {r.content}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
