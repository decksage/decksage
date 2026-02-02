/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
// app/my-decks/components/DeckCardItem.tsx
'use client'

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit, Trash2, User as UserIcon, Eye, Bookmark } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDeck } from '@/app/actions/deckActions';
import { toast } from 'sonner';
import ManaCost from '@/components/ui/ManaCost';

// A tipagem do deck agora inclui os novos campos
type Deck = {
  id: string;
  name: string;
  format: string;
  representative_card_image_url: string | null;
  created_at: string;
  view_count?: number;
  save_count?: number;
  color_identity?: string[];
  decklist?: any;
};

interface DeckCardItemProps {
  deck: Deck;
  onDelete?: (deckId: string) => void;
}

export default function DeckCardItem({ deck, onDelete }: DeckCardItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const manaCostString = deck.color_identity ? `{${deck.color_identity.join('}{')}}` : '';

  // Cálculo da quantidade de cartas
  const cardCount = (deck.decklist?.mainboard?.reduce((acc: number, card: any) => acc + card.count, 0) || 0) +
    (deck.decklist?.sideboard?.reduce((acc: number, card: any) => acc + card.count, 0) || 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDeck(deck.id);

    if (result.success) {
      toast.success(result.message);
      if (onDelete) onDelete(deck.id);
    } else {
      toast.error(result.message);
    }
    setIsDeleting(false);
  };

  const placeholderStyle = {
    backgroundColor: '#171717', // bg-neutral-900
    backgroundImage: 'radial-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px)',
    backgroundSize: '12px 12px',
  };

  return (
    <Card className="bg-neutral-900 py-0 border-neutral-800 h-full flex flex-col group transition-all duration-300 hover:border-amber-500 overflow-hidden shadow-lg hover:shadow-amber-500/10">
      {/* AJUSTE: O <CardHeader> foi removido. A imagem agora é filha direta do <Card> */}
      <Link href={`/my-deck/${deck.format}/${deck.id}`} className="block">
        <div className="relative w-full aspect-[5/3]">
          {deck.representative_card_image_url ? (
            <Image
              src={deck.representative_card_image_url}
              alt={`Carta representativa do deck ${deck.name}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={placeholderStyle}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

          <div className="absolute top-2 right-2">
            <ManaCost cost={manaCostString} />
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            <span className="bg-black/60 backdrop-blur-md text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/30">
              {deck.format}
            </span>
            <span className="bg-black/60 backdrop-blur-md text-neutral-300 text-[10px] font-medium px-2 py-0.5 rounded-full border border-neutral-700">
              {cardCount} Cartas
            </span>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 flex flex-col flex-grow">
        <Link href={`/my-deck/${deck.format}/${deck.id}`}>
          <CardTitle className="text-lg font-bold text-neutral-200 group-hover:text-amber-400 truncate transition-colors">{deck.name}</CardTitle>
        </Link>
        <div className="flex-grow"></div>

        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-3 font-medium">
          <div className="flex items-center gap-1.5">
            <Eye size={14} />
            <span>{deck.view_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bookmark size={14} />
            <span>{deck.save_count || 0}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 font-medium">
            {new Date(deck.created_at).toLocaleDateString('pt-BR')}
          </p>
          <div className="flex gap-2">
            <Link href={`/my-deck/${deck.format}/${deck.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-neutral-800" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Deck?</AlertDialogTitle>
                  <AlertDialogDescription className="text-neutral-400">
                    Esta ação é irreversível. O deck será apagado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white border-0">
                    {isDeleting ? "A excluir..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}