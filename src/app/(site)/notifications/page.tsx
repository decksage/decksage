import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import { markAllNotificationsRead, markNotificationReadForm } from '@/app/actions/communityActions';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Notificações | DeckSage' };

type Row = {
  id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
};

function hrefFor(n: Row): string {
  if (n.type === 'deck_liked' || n.type === 'new_comment') {
    return n.entity_id ? `/decksage/${n.entity_id}` : '/notifications';
  }
  if (n.type === 'comment_reply') {
    const deckId = n.payload && typeof n.payload.deck_id === 'string' ? n.payload.deck_id : null;
    return deckId ? `/decksage/${deckId}` : '/notifications';
  }
  if (n.type === 'new_follower') {
    return n.entity_id ? `/profile/${n.entity_id}` : '/notifications';
  }
  return '/notifications';
}

function labelFor(n: Row): string {
  switch (n.type) {
    case 'new_comment':
      return 'comentou no seu deck';
    case 'comment_reply':
      return 'respondeu o seu comentário';
    case 'deck_liked':
      return 'curtiu o seu deck';
    case 'new_follower':
      return 'começou a seguir você';
    default:
      return n.type;
  }
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/notifications');

  const { data: rows } = await supabase
    .from('notifications')
    .select('id, type, entity_type, entity_id, payload, read_at, created_at, actor_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(80);

  const list = (rows ?? []) as Row[];
  const unread = list.filter((n) => !n.read_at).length;
  const actorIds = [...new Set(list.map((n) => n.actor_id).filter(Boolean))] as string[];
  let actorMap = new Map<string, { username: string | null; full_name: string | null }>();
  if (actorIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', actorIds);
    actorMap = new Map(
      (profs ?? []).map((p) => [p.id, { username: p.username, full_name: p.full_name }]),
    );
  }

  return (
    <>
      <PageHeader
        kicker="Sua conta"
        title="Notificações"
        description={unread > 0 ? `${unread} sem ler.` : 'Você está em dia.'}
        actions={
          unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline">
                Marcar todas como lidas
              </Button>
            </form>
          ) : undefined
        }
        className="border-b-0"
      />
      <div className="mx-auto max-w-2xl px-6 pb-20">
        {list.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nenhuma notificação"
            description="Curtidas, comentários e novos seguidores aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {list.map((n) => {
              const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
              const who = actor?.full_name || actor?.username || 'Alguém';
              return (
                <li key={n.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-primary'}`}
                    />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{who}</span>{' '}
                        <span className="text-muted-foreground">{labelFor(n)}</span>
                      </p>
                      <time
                        dateTime={n.created_at}
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        {new Date(n.created_at).toLocaleString('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!n.read_at && (
                      <form action={markNotificationReadForm}>
                        <input type="hidden" name="id" value={n.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Marcar lida
                        </Button>
                      </form>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={hrefFor(n)}>Abrir</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
