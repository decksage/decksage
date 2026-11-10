import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';
import { captureServer } from '@/lib/analytics/posthog-server';
import { AnalyticsEvents } from '@/lib/analytics/events';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.created_at) {
        const created = new Date(user.created_at).getTime();
        if (Date.now() - created < 120_000) {
          captureServer(user.id, AnalyticsEvents.SIGNUP, { channel: 'oauth_callback' });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redireciona para a página de erro ou inicial em caso de falha
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}
