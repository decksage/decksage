/* eslint-disable no-console */
/* eslint-disable no-undef */
import { cache } from 'react';
import { createClient } from '@/app/utils/supabase/server';
import { isUsableAd, type AdConfig } from './adConfig';

export const AD_PLACEMENTS = {
  home: 'banner_home',
  search: 'banner_search',
  card: 'banner_card',
  collection: 'banner_collection',
  glossary: 'banner_glossary',
  blog_hub: 'banner_blog',
  blog_post: 'banner_blog_post',
  blog_post_end: 'banner_blog_post_end',
  deck: 'banner_deck',
  decks_list: 'banner_decks',
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

const FALLBACK_SLOT = AD_PLACEMENTS.home;

const loadAdSlots = cache(async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('ad_slots').select('*');
  if (error) {
    console.error('Erro ao carregar slots de anúncio:', error.message);
    return new Map<string, AdConfig>();
  }
  return new Map((data ?? []).map((row: AdConfig) => [row.slot_name ?? '', row]));
});

export async function getAdConfig(placement: AdPlacement): Promise<AdConfig | null> {
  const slots = await loadAdSlots();
  const own = slots.get(AD_PLACEMENTS[placement]);

  if (own && !own.is_active) return null;
  if (own && isUsableAd(own)) return own;

  const fallback = slots.get(FALLBACK_SLOT);
  return fallback?.is_active && isUsableAd(fallback) ? fallback : null;
}
