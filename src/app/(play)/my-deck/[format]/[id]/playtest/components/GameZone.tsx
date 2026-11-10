/* eslint-disable no-undef */
'use client'; // Precisa ser client component para usar o hook

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDroppable } from '@dnd-kit/core'; // Importa o hook
import { cn } from '@/lib/utils';

interface GameZoneProps {
  zoneId: string; // ID único para a zona, ex: "graveyard"
  title: string;
  count: number;
  Icon: LucideIcon;
  children?: React.ReactNode;
}

export default function GameZone({ zoneId, title, count, Icon, children }: GameZoneProps) {
  // O hook useDroppable nos diz se uma carta está sobre esta zona
  const { isOver, setNodeRef } = useDroppable({
    id: zoneId,
  });

  return (
    // 'ref={setNodeRef}' designa esta div como uma área "soltável"
    <div ref={setNodeRef}>
      <Card
        className={cn(
          'bg-white/[0.04] border-white/15 text-center transition-all duration-200',
          // Adiciona um brilho quando uma carta está sobre a zona
          isOver && 'border-amber-400 shadow-lg shadow-amber-500/20',
        )}
      >
        <CardHeader className="p-2">
          <CardTitle className="text-sm font-medium text-primary flex items-center justify-center gap-2">
            <Icon size={16} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 text-2xl font-bold min-h-[40px]">
          {children || count}
        </CardContent>
      </Card>
    </div>
  );
}
