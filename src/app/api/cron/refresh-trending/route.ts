import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceClient } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const monday = new Date();
  const day = monday.getUTCDay();
  const diff = (day + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);

  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: likes, error: likesError } = await supabaseServiceClient
    .from('deck_likes')
    .select('deck_id, created_at')
    .gte('created_at', since);

  if (likesError) {
    return NextResponse.json({ error: likesError.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of likes ?? []) {
    counts.set(row.deck_id, (counts.get(row.deck_id) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80);

  await supabaseServiceClient.from('trending_decks_weekly').delete().eq('week_start', weekStart);

  let rank = 1;
  for (const [deckId, likeCount] of sorted) {
    const { data: deck } = await supabaseServiceClient.from('decks').select('format, is_public').eq('id', deckId).single();
    if (!deck?.is_public) continue;
    await supabaseServiceClient.from('trending_decks_weekly').insert({
      week_start: weekStart,
      deck_id: deckId,
      format: deck.format,
      like_count: likeCount,
      rank: rank++,
    });
  }

  return NextResponse.json({ ok: true, week_start: weekStart, inserted: rank - 1 });
}
