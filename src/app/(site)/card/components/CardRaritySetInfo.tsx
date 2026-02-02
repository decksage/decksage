import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Layers, Star } from 'lucide-react';

interface CardRaritySetInfoProps {
  rarity?: string;
  setName?: string;
}

const CardRaritySetInfo = ({ rarity, setName }: CardRaritySetInfoProps) => {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {rarity && (
        <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 uppercase tracking-wider text-xs px-2.5 py-1">
          <Star className="w-3 h-3 mr-1.5 text-amber-500" />
          {rarity}
        </Badge>
      )}
      {setName && (
        <Badge variant="outline" className="border-neutral-700 text-neutral-400 font-normal hover:text-neutral-200">
          <Layers className="w-3 h-3 mr-1.5" />
          {setName}
        </Badge>
      )}
    </div>
  );
};

export default CardRaritySetInfo;