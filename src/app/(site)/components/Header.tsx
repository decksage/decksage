/* eslint-disable no-undef */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GlobalSearch from './GlobalSearch';
import UserMenu from './UserMenu';
import { Menu, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import DeckSageLogo from '../../../../public/decksage.png';
import { createClient } from '@/app/utils/supabase/client';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState<string>('U');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);

        const fullName = session.user.user_metadata?.full_name || 'Usuário';
        const avatar = session.user.user_metadata?.avatar_url || null;

        setInitial(fullName.charAt(0).toUpperCase());
        setAvatarUrl(avatar);
      }
    };

    fetchSession();
  }, []);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <header className="w-full p-4 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-amber-500 hover:text-amber-400 transition-colors">
            <Image
              src={DeckSageLogo}
              alt={'DeckSage'}
              width={110}
              unoptimized
              className=""
              priority={true}
            />
          </Link>

          <div className="flex-1 px-8 hidden sm:block max-w-2xl">
            <GlobalSearch />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/my-deck/create">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.5)] transition-all">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Deck
              </Button>
            </Link>
            <UserMenu />
          </div>

          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated && (
              <Link href="/profile" onClick={handleLinkClick}>
                <Avatar className="h-10 w-10 border-2 border-neutral-600">
                  <AvatarImage src={avatarUrl ?? undefined} alt="Avatar do usuário" />
                  <AvatarFallback className="bg-neutral-700 text-amber-500 font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800/50 shadow-2xl z-40 p-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4 text-center">
            <div className="px-4 py-2">
              <GlobalSearch />
            </div>

            <Link href="/" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
              Buscar
            </Link>
            <Link href="/collections" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
              Coleções
            </Link>
            <Link href="/glossary" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
              Glossário
            </Link>
            <Link href="/deck-analyzer" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
              Análise de Deck IA
            </Link>

            <hr className="border-neutral-700" />

            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
                  Editar Perfil
                </Link>
                <Link href="/my-decks" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
                  Meus Decks
                </Link>
                <Link href="/favorites" onClick={handleLinkClick} className="hover:text-amber-500 transition-colors text-lg py-2">
                  Favoritos
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    setIsAuthenticated(false);
                    handleLinkClick();
                    window.location.href = '/';
                  }}
                  className="text-red-500 hover:text-red-400 text-lg py-2 w-full"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" onClick={handleLinkClick}>
                <button className="w-full bg-amber-500 text-black hover:bg-amber-600 px-4 py-2 rounded-lg">
                  Login
                </button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
