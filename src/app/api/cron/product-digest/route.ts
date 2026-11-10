import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateEmailHTML } from '@/lib/email-template';
import { supabaseServiceClient } from '@/app/lib/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://decksage.com.br';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'missing_resend' }, { status: 500 });
  }

  const { data: profiles, error } = await supabaseServiceClient
    .from('profiles')
    .select('email, notification_digest')
    .not('email', 'is', null)
    .in('notification_digest', ['weekly', 'daily']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const html = generateEmailHTML(
    `<p>Olá! Segue o resumo do produto DeckSage.</p>
     <p><a href="${siteUrl}/changelog">Ver changelog</a> · <a href="${siteUrl}/roadmap">Roadmap</a> · <a href="${siteUrl}/community">Conteúdo da comunidade</a></p>
     <p>Obrigado por jogar connosco.</p>`,
  );

  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[];
  const BATCH = 45;
  let sent = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    await resend.emails.send({
      from: 'DeckSage <nao-responda@decksage.com.br>',
      to: ['nao-responda@decksage.com.br'],
      bcc: batch,
      subject: 'DeckSage — atualizações do produto',
      html,
    });
    sent += batch.length;
  }

  return NextResponse.json({ ok: true, sent });
}
