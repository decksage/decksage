import PostCard from '../blog/PostCard';
import SectionHeading from './SectionHeading';

export default function LatestPostsSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) {
    return null;
  }

  const [featured, ...rest] = posts;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
      <SectionHeading
        index="01"
        kicker="Hub de conteúdo"
        title="Últimas do blog"
        description="Análises, guias de estratégia e as novidades do universo de Magic: The Gathering."
        action={{ href: '/blog', label: 'Ver todos os artigos' }}
        className="reveal"
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:grid-rows-2">
        <div className="reveal lg:col-span-2 lg:row-span-2">
          <PostCard post={featured} variant="feature" />
        </div>
        {rest.map((post) => (
          <div key={post.id} className="reveal">
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </section>
  );
}
