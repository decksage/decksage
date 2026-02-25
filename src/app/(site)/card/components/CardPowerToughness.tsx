import React from 'react';

interface CardPowerToughnessProps {
  power?: string;
  toughness?: string;
}

const CardPowerToughness = ({ power, toughness }: CardPowerToughnessProps) => {
  if (!power || !toughness) return null;
  return (
    <div className="flex justify-end pt-6">
      <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg px-4 py-2 flex items-center gap-2 shadow-inner">
        <span className="text-xl md:text-2xl font-bold text-white">{power}</span>
        <span className="text-neutral-600 text-lg">/</span>
        <span className="text-xl md:text-2xl font-bold text-white">{toughness}</span>
      </div>
    </div>
  );
};

export default CardPowerToughness;
