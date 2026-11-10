import { Map } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';
import RoadmapVoteButton from './RoadmapVoteButton';

export const metadata = {
  title: 'Roadmap | DeckSage',
  description: 'Sugestões da comunidade e estado das melhorias do DeckSage.',
};

const STATUS: Record<string, { label: string; className: string }> = {
  new: { label: 'Novo', className: 'border-white/15 text-muted-foreground' },
  in_analysis: { label: 'Em análise', className: 'border-primary/40 text-primary' },
  completed: { label: 'Concluído', className: 'border-emerald-400/30 text-emerald-300' },
  unnecessary: { label: 'Arquivado', className: 'border-white/10 text-muted-foreground/70' },
};

export default async function RoadmapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from('feedback')
    .select('id, content, feedback_type, status, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const ids = (items ?? []).map((i) => i.id);
  let voteMap: Record<string, number> = {};
  let myVotes = new Set<string>();

  if (ids.length > 0) {
    const [{ data: votes }, mine] = await Promise.all([
      supabase.from('feedback_votes').select('feedback_id').in('feedback_id', ids),
      user
        ? supabase
            .from('feedback_votes')
            .select('feedback_id')
            .eq('user_id', user.id)
            .in('feedback_id', ids)
        : Promise.resolve({ data: [] as { feedback_id: string }[] }),
    ]);
    voteMap = (votes ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.feedback_id] = (acc[row.feedback_id] ?? 0) + 1;
      return acc;
    }, {});
    myVotes = new Set((mine.data ?? []).map((m) => m.feedback_id));
  }

  return (
    <>
      <PageHeader
        kicker="Produto"
        title="Roadmap"
        description="Ideias aprovadas pela equipe. Vote para ajudar a decidir o que construir em seguida."
        actions={
          <a
            href="/feedback"
            className="inline-flex h-11 items-center rounded-md border border-white/15 px-5 text-sm font-semibold hover:border-primary/60"
          >
            Enviar uma ideia
          </a>
        }
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        {!items?.length ? (
          <EmptyState
            icon={Map}
            title="Nenhum item público ainda"
            description="Quando uma sugestão for aprovada, ela entra nesta lista."
            action={{ href: '/feedback', label: 'Enviar uma ideia' }}
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const status = STATUS[item.status] ?? {
                label: item.status,
                className: 'border-white/15',
              };
              return (
                <li key={item.id} className="frame flex items-start gap-5 p-5 [--cut:12px] sm:p-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="kicker rounded-full border border-white/10 px-2.5 py-1">
                        {item.feedback_type}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.14em] ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
                      {item.content}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <RoadmapVoteButton
                    feedbackId={item.id}
                    initialCount={voteMap[item.id] ?? 0}
                    initialVoted={myVotes.has(item.id)}
                    canVote={!!user}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
