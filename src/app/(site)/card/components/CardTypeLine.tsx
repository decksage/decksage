import React from 'react';

interface CardTypeLineProps {
  typeLine?: string;
}

const CardTypeLine = ({ typeLine }: CardTypeLineProps) => {
  return (
    <div className="flex items-center gap-2 text-lg md:text-xl text-neutral-300 font-medium pb-2 border-b border-neutral-800/50">
      <span>{typeLine}</span>
    </div>
  );
};

export default CardTypeLine;