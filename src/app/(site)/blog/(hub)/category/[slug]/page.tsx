/* eslint-disable no-undef */
/* eslint-disable no-console */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PostCard from '@/app/(site)/components/blog/PostCard';
import BlogSidebar from '@/app/(site)/components/blog/BlogSidebar';
import PageHeader, { MetaChip } from '@/app/(site)/components/page/PageHeader';
import Pagination from '@/app/(site)/components/page/Pagination';
import EmptyState from '@/app/(site)/components/page/EmptyState';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const POSTS_PER_PAGE = 9;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase.from('categories').select('name').eq('slug', slug).maybeSingle();
  return { title: data ? `${data.name} | Hub de Conteúdo` : 'Categoria não encontrada' };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const currentPage = Math.max(1, Number(page) || 1);
  const supabase = createClient();

  const [
    { data: category },
    { data: posts, error: postsError },
    { data: totalPosts, error: countError },
  ] = await Promise.all([
    supabase.from('categories').select('name').eq('slug', slug).maybeSingle(),
    supabase.rpc('get_posts_by_category_slug_paginated', {
      category_slug: slug,
      page_size: POSTS_PER_PAGE,
      page_offset: (currentPage - 1) * POSTS_PER_PAGE,
    }),
    supabase.rpc('count_posts_in_category', { category_slug: slug }),
  ]);

  if (!category) notFound();
  if (postsError || countError) {
    console.error('Erro ao buscar posts da categoria:', postsError || countError);
  }

  const total = Number(totalPosts) || 0;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <>
      <PageHeader
        kicker="Categoria"
        title={category.name}
        back={{ href: '/blog', label: 'Todos os artigos' }}
        meta={
          <MetaChip icon={FileText}>
            <span className="font-semibold text-foreground tabular-nums">{total}</span>{' '}
            {total === 1 ? 'artigo' : 'artigos'}
          </MetaChip>
        }
        className="border-b-0"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 lg:grid-cols-[1fr_18rem] lg:gap-14">
        <div className="min-w-0">
          {posts && posts.length > 0 ? (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post: any) => (
                  <li key={post.id}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
              <Pagination
                basePath={`/blog/category/${slug}`}
                currentPage={currentPage}
                totalPages={totalPages}
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum artigo nesta categoria"
              description="Ainda não publicamos nada aqui. Que tal explorar as outras?"
              action={{ href: '/blog', label: 'Ver todos os artigos' }}
            />
          )}
        </div>
        <BlogSidebar activeCategory={slug} />
      </div>
    </>
  );
}
