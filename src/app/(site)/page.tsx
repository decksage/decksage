/* eslint-disable no-undef */
/* eslint-disable no-console */
import HeroSection from '@/app/(site)/components/home/HeroSection';
import LatestSetsSection from '@/app/(site)/components/home/LatestSetsSection';
import ManaColorNavigationSection from '@/app/(site)/components/home/ManaColorNavigationSection';
import LatestPostsSection from './components/home/LatestPostsSection';
import AIDeckBuilderPromo from './components/home/AIDeckBuilderPromo';
import DynamicAdSlot from '@/app/(site)/components/ads/DynamicAdSlot';
import { createClient } from '@/app/utils/supabase/server';
import { fetchLatestSets } from '@/app/lib/scryfall';

export default async function Home() {
  const supabase = createClient();

  const [
    latestSetsData,
    { data: postsData, error: postsError },
    { data: adConfig, error: adError },
  ] = await Promise.all([
    fetchLatestSets(3),
    supabase.rpc('get_latest_published_posts', { post_limit: 3 }),
    supabase
      .from('ad_slots')
      .select('*')
      .eq('slot_name', 'banner_home')
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (postsError) {
    console.error('Home: Erro ao buscar posts para a homepage com RPC:', postsError);
  }
  if (adError) {
    console.error('Home: Erro ao buscar configuração de anúncio:', adError);
  }

  return (
    <>
      <HeroSection />
      <AIDeckBuilderPromo />
      <LatestPostsSection posts={postsData || []} />

      {adConfig && (
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <DynamicAdSlot adConfig={adConfig} />
        </div>
      )}

      <div className="relative border-y border-white/5 bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-20 px-6 py-20 sm:py-24">
          <ManaColorNavigationSection />
          <LatestSetsSection sets={latestSetsData || []} />
        </div>
      </div>
    </>
  );
}
