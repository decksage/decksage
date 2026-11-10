// Must match `images.remotePatterns` in next.config.ts. Scryfall's CDN rejects the
// optimizer's upstream fetch (400), so its images are always served unoptimized.
const OPTIMIZABLE_HOSTS = ['irvppzfjscjphhnzxcxp.supabase.co'];

export function isOptimizableImage(url: string) {
  try {
    return OPTIMIZABLE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}
