// app/components/deck/CreatorHeader.tsx
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Profile = {
  username: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
};

export default function CreatorHeader({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const fallbackInitial = profile.username?.charAt(0).toUpperCase() || '?';

  // Estilo para o placeholder com um padrão de pontos sutis
  const placeholderStyle = {
    backgroundColor: '#262626', // bg-white/[0.04]
    backgroundImage: 'radial-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px)',
    backgroundSize: '10px 10px',
  };

  return (
    <div className="mb-8 p-4 bg-card rounded-lg border border-white/10">
      <div className="relative h-24 sm:h-32 rounded-md overflow-hidden">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt="Capa do criador"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          // AJUSTE: Usando o novo placeholder com padrão de pontos
          <div className="w-full h-full" style={placeholderStyle} />
        )}
      </div>
      <div className="flex items-center -mt-8 ml-4 sm:-mt-10 sm:ml-6">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-neutral-900">
          <AvatarImage src={profile.avatar_url || ''} alt={`Avatar de ${profile.username}`} />
          <AvatarFallback className="text-2xl bg-neutral-700 text-primary">
            {fallbackInitial}
          </AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="text-xs text-muted-foreground">Criado por</p>
          <h3 className="text-lg font-bold text-primary">@{profile.username || 'Anônimo'}</h3>
        </div>
      </div>
    </div>
  );
}
