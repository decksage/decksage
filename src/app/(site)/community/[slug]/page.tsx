import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
import { createClient } from '@/app/utils/supabase/server';
import PageHeader, { MetaChip } from '../../components/page/PageHeader';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  primer: 'Primer',
  tier_list: 'Tier list',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('community_publications')
    .select('title')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return { title: data ? `${data.title} | Comunidade` : 'Publicação não encontrada' };
}

export default async function CommunityPublicationPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: pub } = await supabase
    .from('community_publications')
    .select('title, body, publication_type, created_at, user_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pub) notFound();

  const { data: author } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', pub.user_id)
    .maybeSingle();

  const clean = DOMPurify.sanitize(pub.body || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
  });
  const authorName = author?.full_name || author?.username || 'Autor';

  return (
    <article>
      <PageHeader
        kicker={TYPE_LABEL[pub.publication_type] ?? pub.publication_type}
        title={pub.title}
        back={{ href: '/community', label: 'Publicações' }}
        meta={
          <>
            <MetaChip>{authorName}</MetaChip>
            <MetaChip>
              {new Date(pub.created_at).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </MetaChip>
          </>
        }
        className="border-b-0"
      />
      <div
        className="mx-auto max-w-3xl px-6 pb-20 text-[17px] leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:uppercase [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </article>
  );
}
