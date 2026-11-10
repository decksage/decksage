'use client';

import { DollarSign, Loader2, Landmark } from 'lucide-react';

interface PriceDisplayProps {
  priceData: { usd: number; brl: number } | null;
  isLoading: boolean;
}

export default function PriceDisplay({ priceData, isLoading }: PriceDisplayProps) {
  // Se não estiver carregando e não houver dados, não renderiza nada para manter o layout limpo.
  if (!isLoading && !priceData) {
    return null;
  }

  return (
    // O contêiner principal agora só adiciona uma margem no topo.
    <div className="mt-4 h-8 flex items-center justify-center animate-in fade-in-50 duration-300">
      {/* Estado de Loading Discreto */}
      {isLoading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Buscando preço...
        </div>
      )}

      {/* Exibição dos Preços Lado a Lado */}
      {priceData && !isLoading && (
        <div className="flex items-center justify-center gap-4 px-3 py-1.5 rounded-full bg-card border border-white/10">
          {/* Seção USD */}
          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
            <DollarSign size={14} className="text-green-500" />
            <span className="font-semibold text-white">${priceData.usd.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">USD</span>
          </div>

          {/* Linha divisória vertical */}
          <div className="h-4 w-px bg-neutral-700"></div>

          {/* Seção BRL */}
          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
            <Landmark size={14} className="text-primary" />
            <span className="font-semibold text-white">R$ {priceData.brl.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">(Aprox.)</span>
          </div>
        </div>
      )}
    </div>
  );
}
