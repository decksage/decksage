import { createClient } from '@/app/utils/supabase/server';
import { Metadata } from 'next';
import FeedbackForm from './components/FeedbackForm';
import PageHeader from '../components/page/PageHeader';

export const metadata: Metadata = {
  title: 'Feedback - DeckSage',
  description: 'Envie suas sugestões, elogios ou reporte problemas para a equipe do DeckSage.',
};

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = '';
  let userEmail = '';

  if (user) {
    userName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    userEmail = user.email || '';

    if (!userName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name) userName = profile.full_name;
    }
  }

  return (
    <>
      <PageHeader
        kicker="Produto"
        title="Feedback"
        description="Sugestão, elogio ou problema. Sua mensagem chega direto para a equipe."
        className="border-b-0"
      />
      <div className="mx-auto max-w-xl px-6 pb-20">
        <div className="frame p-6 [--cut:14px] sm:p-8">
          <FeedbackForm user={user} userName={userName} userEmail={userEmail} />
        </div>
      </div>
    </>
  );
}
