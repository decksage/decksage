import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { isOptimizableImage } from '@/lib/images';

type PostCardProps = {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image_url: string | null;
    published_at: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  variant?: 'default' | 'feature';
};

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const authorName = post.username || 'Anônimo';
  const isFeature = variant === 'feature';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="frame group flex h-full flex-col [--cut:16px] hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
    >
      <div
        className={cn(
          'chamfer-tl relative m-px overflow-hidden [--cut:15px]',
          isFeature ? 'aspect-[16/10] lg:aspect-auto lg:min-h-[20rem] lg:flex-1' : 'aspect-video',
        )}
      >
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            unoptimized={!isOptimizableImage(post.cover_image_url)}
            quality={60}
            sizes={
              isFeature
                ? '(min-width: 1024px) 66vw, 100vw'
                : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
            }
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_60%)] bg-secondary">
            <span className="font-display text-3xl font-bold uppercase tracking-widest text-primary/40">
              MTG
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
      </div>

      <div className={cn('flex flex-1 flex-col p-5', isFeature && 'lg:flex-none lg:p-7')}>
        {post.published_at && (
          <time
            dateTime={post.published_at}
            className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary"
          >
            {new Date(post.published_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        )}
        <h3
          className={cn(
            'mt-2 text-balance font-display font-bold leading-tight text-foreground transition-colors group-hover:text-primary',
            isFeature ? 'text-2xl sm:text-3xl' : 'line-clamp-2 text-xl',
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className={cn(
              'mt-3 text-sm leading-relaxed text-muted-foreground',
              isFeature ? 'line-clamp-3 sm:text-base' : 'line-clamp-2',
            )}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.avatar_url || ''} alt="" />
            <AvatarFallback className="text-[10px]">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{authorName}</span>
        </div>
      </div>
    </Link>
  );
}
