/* eslint-disable no-undef */
/* eslint-disable no-console */
import { FileText } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PostCard from '../../components/blog/PostCard';
import BlogSidebar from '../../components/blog/BlogSidebar';
import PageHeader from '../../components/page/PageHeader';
import Pagination from '../../components/page/Pagination';
import EmptyState from '../../components/page/EmptyState';
import AdSlot from '../../components/ads/AdSlot';

export const metadata = {
  title: 'Hub de Conteúdo | MTG Translate',
  description: 'Explore artigos, guias e análises sobre o universo de Magic: The Gathering.',
};

const POSTS_IN_GRID = 9;
const POSTS_IN_FEATURED = 1;

export default async function BlogHubPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const supabase = createClient();

  const isFirst = currentPage === 1;
  const pageSize = isFirst ? POSTS_IN_FEATURED + POSTS_IN_GRID : POSTS_IN_GRID;
  const offset = isFirst ? 0 : POSTS_IN_FEATURED + (currentPage - 2) * POSTS_IN_GRID;

  const [{ count, error: countError }, { data: posts, error }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.rpc('get_published_posts_paginated', { page_size: pageSize, page_offset: offset }),
  ]);

  if (countError) console.error('Erro ao contar posts:', countError);
  if (error) console.error('Erro ao buscar posts para o hub com RPC:', error);

  const total = count ?? 0;
  const totalPages =
    total <= POSTS_IN_FEATURED + POSTS_IN_GRID
      ? 1
      : 1 + Math.ceil((total - POSTS_IN_FEATURED - POSTS_IN_GRID) / POSTS_IN_GRID);

  const featuredPost = isFirst ? posts?.[0] : null;
  const regularPosts = (isFirst ? posts?.slice(1) : posts) ?? [];

  return (
    <>
      <PageHeader
        kicker="Hub de conteúdo"
        title="Artigos e guias"
        description="Análises de meta, guias para iniciantes e tudo o que acontece no multiverso."
        className="border-b-0"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 lg:grid-cols-[1fr_18rem] lg:gap-14">
        <div className="min-w-0">
          {!posts?.length ? (
            <EmptyState
              icon={FileText}
              title={isFirst ? 'Nenhum artigo publicado ainda' : 'Página vazia'}
              description={
                isFirst ? 'Volte em breve para novidades.' : 'Não há artigos nesta página.'
              }
              action={isFirst ? undefined : { href: '/blog', label: 'Voltar ao início' }}
            />
          ) : (
            <>
              {featuredPost && (
                <div className="mb-8">
                  <PostCard post={featuredPost} variant="feature" />
                </div>
              )}
              <AdSlot placement="blog_hub" className="mb-8" />
              {regularPosts.length > 0 && (
                <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {regularPosts.map((post: any) => (
                    <li key={post.id}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
              )}
              <Pagination
                basePath="/blog"
                currentPage={currentPage}
                totalPages={totalPages}
                className="mt-12"
              />
            </>
          )}
        </div>
        <BlogSidebar />
      </div>
    </>
  );
}
