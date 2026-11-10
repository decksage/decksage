/* eslint-disable no-undef */
/* eslint-disable no-console */
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { createClient } from '@/app/utils/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import styles from './PostStyles.module.scss';
import BlogEngagement from './BlogEngagement';
import PostCommentsSection from './PostCommentsSection';
import { isOptimizableImage } from '@/lib/images';
import AdSlot from '@/app/(site)/components/ads/AdSlot';

const MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD = 6;

function splitForInArticleAd(html: string): [string, string] {
  const ends: number[] = [];
  const closing = /<\/p>/gi;
  for (let match = closing.exec(html); match; match = closing.exec(html)) {
    ends.push(match.index + match[0].length);
  }
  if (ends.length < MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD) return [html, ''];

  const cut = ends[Math.floor(ends.length / 2) - 1];
  const before = html.slice(0, cut);
  const isTopLevel =
    (before.match(/<(blockquote|ul|ol|table|div)\b/gi) ?? []).length ===
    (before.match(/<\/(blockquote|ul|ol|table|div)>/gi) ?? []).length;
  return isTopLevel ? [before, html.slice(cut)] : [html, ''];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

type PostData = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  categories: { slug: string; name: string }[] | null;
};

const getPostMeta = cache(async (slug: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, excerpt, meta_title, meta_description, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostMeta(slug);
  if (!post) return { title: 'Post não encontrado' };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.cover_image_url ? [{ url: post.cover_image_url, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const [{ data: post, error }, postRow] = await Promise.all([
    supabase.rpc('get_published_post_details', { p_slug: slug }).single<PostData>(),
    getPostMeta(slug),
  ]);

  if (error || !post) notFound();

  after(async () => {
    const { error: viewError } = await supabase.rpc('increment_post_view', { post_slug: slug });
    if (viewError) console.error(`Falha ao incrementar view para ${slug}:`, viewError.message);
  });

  const cleanContent = post.content ? DOMPurify.sanitize(post.content) : '';
  const words = cleanContent
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(words / 220));
  const authorName = post.full_name || post.username || 'Equipe';
  const [firstHalf, secondHalf] = splitForInArticleAd(cleanContent);

  return (
    <article>
      <BlogEngagement slug={slug} />

      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute left-1/2 top-[-14rem] -z-10 h-[30rem] w-[60rem] -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
        />
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-10 sm:pt-14">
          <Link
            href="/blog"
            className="rise group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Hub de conteúdo
          </Link>

          {post.categories && post.categories.length > 0 && (
            <ul className="rise mt-8 flex flex-wrap gap-2 [--delay:40ms]">
              {post.categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/blog/category/${cat.slug}`}
                    className="kicker inline-flex h-7 items-center rounded-full border border-primary/30 px-3 hover:border-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h1 className="rise mt-5 text-balance font-display text-4xl font-bold uppercase leading-[0.98] tracking-tight [--delay:80ms] sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="rise mt-5 text-pretty text-lg leading-relaxed text-muted-foreground [--delay:120ms]">
              {post.excerpt}
            </p>
          )}

          <div className="rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground [--delay:160ms]">
            <span className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 border border-white/15">
                <AvatarImage src={post.avatar_url || undefined} alt="" />
                <AvatarFallback>{authorName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{authorName}</span>
            </span>
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readingMinutes} min de leitura
            </span>
          </div>
        </div>

        {post.cover_image_url && (
          <div className="rise mx-auto max-w-5xl px-0 [--delay:200ms] sm:px-6">
            <div className="relative aspect-[16/9] overflow-hidden border-y border-white/10 sm:rounded-lg sm:border">
              <Image
                src={post.cover_image_url}
                alt=""
                fill
                preload
                unoptimized={!isOptimizableImage(post.cover_image_url)}
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-20 pt-12 sm:pt-16">
        <div className={styles.articleContent} dangerouslySetInnerHTML={{ __html: firstHalf }} />
        {secondHalf ? (
          <>
            <AdSlot placement="blog_post" className="my-10" />
            <div
              className={styles.articleContent}
              dangerouslySetInnerHTML={{ __html: secondHalf }}
            />
          </>
        ) : null}
        <AdSlot placement="blog_post_end" className="mt-12" />
        {postRow?.id && <PostCommentsSection postId={postRow.id} />}
      </div>
    </article>
  );
}
