 
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, User, LogOut, Swords, ShieldCheck, Gift, Layers } from 'lucide-react';
import ReferralLink from '@/app/(site)/components/ui/ReferralLink';
import UserPointsDisplay from '@/app/(site)/components/ui/UserPointsDisplay';
import type { Viewer } from './viewer';

export const accountLinks = [
  { href: '/profile', label: 'Editar Perfil', icon: User },
  { href: '/my-decks', label: 'Meus Decks', icon: Swords },
  { href: '/my-collection', label: 'Minhas Coleções', icon: Layers },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
];

export function ViewerAvatar({ viewer, className }: { viewer: Viewer; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={viewer.avatarUrl ?? undefined} alt="" />
      <AvatarFallback className="bg-secondary font-display font-bold text-primary">
        {viewer.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export default function UserMenu({
  viewer,
  onSignOut,
}: {
  viewer: Viewer | null;
  onSignOut: () => void;
}) {
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);

  if (!viewer) {
    return (
      <Button asChild variant="outline" className="h-10 border-white/15 bg-transparent">
        <Link href="/login">Entrar</Link>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Abrir menu da conta"
            className="rounded-full ring-1 ring-white/15 ring-offset-2 ring-offset-background hover:ring-primary data-[state=open]:ring-primary"
          >
            <ViewerAvatar viewer={viewer} className="h-9 w-9" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 border-white/10 bg-popover/95 backdrop-blur-xl" align="end" sideOffset={10}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-sm font-semibold leading-none">{viewer.name}</p>
              {viewer.email && (
                <p className="truncate text-xs leading-none text-muted-foreground">{viewer.email}</p>
              )}
              <div className="pt-1.5">
                <UserPointsDisplay points={viewer.points} size="sm" />
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {accountLinks.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href} className="flex w-full items-center">
                <Icon className="mr-2 h-4 w-4" />
                <span>{label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          {viewer.role === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-primary">
                <Link href="/admin" className="flex w-full items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Painel Admin</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsReferralDialogOpen(true)}>
            <Gift className="mr-2 h-4 w-4" />
            <span>Convidar um Amigo</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-400" onSelect={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="border-white/10 bg-popover">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              Convide um Amigo e Ganhe Pontos!
            </DialogTitle>
            <DialogDescription>
              Compartilhe seu link exclusivo abaixo. Para cada amigo que se cadastrar, você ganha
              pontos.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <ReferralLink referralCode={viewer.referralCode} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
