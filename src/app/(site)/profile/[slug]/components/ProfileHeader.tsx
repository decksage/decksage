'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileFollowButton from './ProfileFollowButton';
import DiscordCta from '@/app/(site)/components/DiscordCta';

// Tipagem para os dados que o componente espera
type ProfileHeaderProps = {
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    bio: string | null;
    website_url?: string | null;
    favorite_format?: string | null;
    reputation_points?: number | null;
    reputation_level?: number | null;
    is_ambassador?: boolean | null;
  } | null;
  viewerId?: string | null;
  initialFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
};

export default function ProfileHeader({
  profile,
  viewerId,
  initialFollowing = false,
  followerCount = 0,
  followingCount = 0,
}: ProfileHeaderProps) {
  // Lida com o caso de perfil não encontrado
  if (!profile) {
    return null;
  }

  const fallbackInitial = profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?';

  return (
    <header>
      {/* Imagem de Capa */}
      <div className="h-48 sm:h-64 bg-white/[0.04] relative">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt={`Capa do perfil de ${profile.username}`}
            fill
            unoptimized
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-700"></div>
        )}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Container para Avatar e Informações */}
      <div className="container mx-auto px-6 -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* AJUSTE: O Avatar agora usa a estrutura correta do Shadcn/UI */}
          <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-neutral-950 bg-neutral-700 flex-shrink-0">
            <Avatar className="w-full h-full">
              <AvatarImage src={profile.avatar_url || ''} alt={`Avatar de ${profile.username}`} />
              <AvatarFallback className="text-4xl bg-neutral-700">
                {fallbackInitial.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="pb-4 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="flex flex-wrap items-center gap-2 font-display text-4xl font-bold uppercase tracking-tight">
                  {profile.full_name || 'Usuário'}
                  {profile.is_ambassador && (
                    <span className="text-xs font-semibold rounded-full bg-primary/15 text-primary px-2 py-0.5 border border-primary/40">
                      Embaixador
                    </span>
                  )}
                </h1>
                <p className="text-primary">@{profile.username || 'username'}</p>
              </div>
              {viewerId && viewerId !== profile.id && (
                <ProfileFollowButton
                  targetUserId={profile.id}
                  initialFollowing={initialFollowing}
                  canInteract
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{followerCount}</strong> seguidores
              </span>
              <span>
                <strong className="text-foreground">{followingCount}</strong> a seguir
              </span>
              {typeof profile.reputation_points === 'number' && (
                <span>
                  Reputação: <strong className="text-primary">{profile.reputation_points}</strong> ·
                  nv {profile.reputation_level ?? 1}
                </span>
              )}
            </div>
            {profile.favorite_format && (
              <p className="text-muted-foreground text-sm mt-2">
                Formato favorito: {profile.favorite_format}
              </p>
            )}
            {profile.bio && <p className="text-muted-foreground mt-2 text-sm max-w-xl">{profile.bio}</p>}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary text-sm mt-2 inline-block"
              >
                Website / link
              </a>
            )}
            <div className="mt-4">
              <DiscordCta variant="banner" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
