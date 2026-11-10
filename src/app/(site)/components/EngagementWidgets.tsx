import { createClient } from '@/app/utils/supabase/server';
import NpsPrompt from './NpsPrompt';
import OnboardingSurvey from './OnboardingSurvey';

export default async function EngagementWidgets() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    return <OnboardingSurvey />;
  }

  const created = new Date(user.created_at);
  const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) return null;

  const { count: deckCount } = await supabase
    .from('decks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((deckCount ?? 0) < 2) return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: existingNps } = await supabase
    .from('nps_responses')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())
    .maybeSingle();

  if (existingNps) return null;

  return <NpsPrompt />;
}
