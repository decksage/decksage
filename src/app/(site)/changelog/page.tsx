import Link from 'next/link';
import Image from 'next/image';
import { ScrollText } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import { isOptimizableImage } from '@/lib/images';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const metadata = {
  title: 'Changelog | DeckSage',
  description: 'Atualizações do produto DeckSage.',
};

export default async function ChangelogPage() {
  const supabase = createClient();
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'atualizacoes-do-produto')
    .maybeSingle();

  let posts: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    published_at: string;
    cover_image_url: string | null;
  }[] = [];

  if (cat?.id) {
    const { data: links } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', cat.id);
    const postIds = (links ?? []).map((l) => l.post_id).filter(Boolean);
    if (postIds.length) {
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, published_at, cover_image_url')
        .in('id', postIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      posts = data ?? [];
    }
  }

  return (
    <>
      <PageHeader
        kicker="Produto"
        title="Changelog"
        description="Novidades do DeckSage. Tudo o que publicamos na categoria Atualizações do Produto aparece aqui."
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        {posts.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Sem entradas ainda"
            description="Quando publicarmos uma atualização, ela entra nesta linha do tempo."
            action={{
              href: '/blog/category/atualizacoes-do-produto',
              label: 'Ver a categoria no blog',
            }}
          />
        ) : (
          <ol className="relative space-y-0 border-l border-white/10 pl-8">
            {posts.map((post) => (
              <li key={post.id} className="relative pb-10">
                <span
                  aria-hidden
                  className="absolute -left-[2.4rem] top-1.5 h-3 w-3 rounded-full bg-primary"
                />
                <time dateTime={post.published_at} className="kicker">
                  {new Date(post.published_at).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
                <Link href={`/blog/${post.slug}`} className="group mt-3 flex gap-5">
                  {post.cover_image_url && (
                    <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-md border border-white/10 sm:block">
                      <Image
                        src={post.cover_image_url}
                        alt=""
                        fill
                        unoptimized={!isOptimizableImage(post.cover_image_url)}
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
