import { Calendar } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import DiscordCta from '@/app/(site)/components/DiscordCta';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Eventos | DeckSage',
  description: 'Deck da semana, desafios e encontros da comunidade DeckSage.',
};

export default async function CommunityEventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from('community_events')
    .select('event_type, title, description, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <>
      <PageHeader
        kicker="Comunidade"
        title="Eventos"
        description="Deck da semana, desafios e AMAs. A votação e a conversa acontecem no Discord."
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl space-y-8 px-6 pb-20">
        <DiscordCta variant="banner" />
        {events && events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((e) => (
              <li key={`${e.event_type}-${e.created_at}`} className="frame p-5 [--cut:12px]">
                <p className="kicker">{e.event_type.replace(/_/g, ' ')}</p>
                <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-tight">
                  {e.title}
                </h2>
                {e.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {e.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Calendar}
            title="Nenhum evento no momento"
            description="Quando a equipe registrar um desafio ou o deck da semana, ele aparece aqui."
          />
        )}
      </div>
    </>
  );
}
