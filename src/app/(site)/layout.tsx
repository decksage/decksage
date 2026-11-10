/* eslint-disable no-undef */
import Header from '@/app/(site)/components/Header';
import Footer from '@/app/(site)/components/Footer';
import { createClient } from '@/app/utils/supabase/server';
import FloatingFeedback from './components/FloatingFeedback';
import StickyFooterAd from '@/app/(site)/components/ads/StickyFooterAd';
import EngagementWidgets from './components/EngagementWidgets';
import type { Viewer } from './components/viewer';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, { data: adConfig }] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('full_name, avatar_url, role, referral_code, points')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('ad_slots')
      .select('*')
      .eq('slot_name', 'banner_sticky_footer')
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const viewer: Viewer | null = user
    ? {
        email: user.email ?? null,
        name: profile?.full_name || user.user_metadata?.full_name || 'Usuário',
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        role: profile?.role ?? null,
        referralCode: profile?.referral_code ?? null,
        points: profile?.points ?? null,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header viewer={viewer} />
      <main id="conteudo" className="flex-grow">
        {children}
      </main>
      <Footer />
      <FloatingFeedback user={user} />
      <EngagementWidgets />
      <StickyFooterAd adConfig={adConfig} />
    </div>
  );
}
