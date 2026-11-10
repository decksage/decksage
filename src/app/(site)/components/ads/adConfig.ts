export const ADSENSE_CLIENT = 'ca-pub-9935800504955016';

export type AdConfig = {
  slot_name?: string | null;
  ad_type: 'adsense' | 'custom';
  is_active?: boolean | null;
  adsense_client_id?: string | null;
  adsense_slot_id?: string | null;
  custom_image_url?: string | null;
  custom_link_url?: string | null;
  custom_alt_text?: string | null;
};

export function isUsableAd(config: AdConfig | null | undefined): config is AdConfig {
  if (!config) return false;
  if (config.ad_type === 'custom') {
    return !!config.custom_image_url && !!config.custom_link_url;
  }
  return (
    /^ca-pub-\d{16}$/.test(config.adsense_client_id ?? '') &&
    /^\d{6,}$/.test(config.adsense_slot_id ?? '')
  );
}
