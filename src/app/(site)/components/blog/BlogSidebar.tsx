import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/server';
import { cn } from '@/lib/utils';

export default async function BlogSidebar({ activeCategory }: { activeCategory?: string }) {
  const supabase = createClient();

  const [{ data: categories }, { data: popularPosts }] = await Promise.all([
    supabase.from('categories').select('name, slug').limit(12),
    supabase
      .from('posts')
      .select('title, slug')
      .eq('status', 'published')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  return (
    <aside className="order-first space-y-10 lg:order-none lg:sticky lg:top-[calc(var(--header-offset)+2rem)] lg:self-start">
      {categories && categories.length > 0 && (
        <nav aria-labelledby="blog-categorias">
          <h2 id="blog-categorias" className="kicker mb-4">
            Categorias
          </h2>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/blog"
                aria-current={!activeCategory ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors',
                  !activeCategory
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground',
                )}
              >
                Todos
              </Link>
            </li>
            {categories.map((cat) => {
              const active = cat.slug === activeCategory;
              return (
                <li key={cat.slug}>
                  <Link
                    href={`/blog/category/${cat.slug}`}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground',
                    )}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {popularPosts && popularPosts.length > 0 && (
        <section aria-labelledby="blog-populares" className="hidden lg:block">
          <h2 id="blog-populares" className="kicker mb-4">
            Mais lidos
          </h2>
          <ol className="divide-y divide-white/5">
            {popularPosts.map((post, i) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group flex gap-4 py-4">
                  <span className="font-display text-2xl font-bold leading-none text-primary/50 tabular-nums group-hover:text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground/85 group-hover:text-foreground">
                    {post.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </aside>
  );
}
