import React from 'react';
import ManaCost from '@/components/ui/ManaCost';

interface CardHeaderInfoProps {
  name: string;
  manaCost?: string;
}

const CardHeaderInfo = ({ name, manaCost }: CardHeaderInfoProps) => {
  return (
    <div className="flex justify-between items-start gap-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
        {name}
      </h1>
      {manaCost && (
        <div className="mt-1">
          <ManaCost cost={manaCost} />
        </div>
      )}
    </div>
  );
};

export default CardHeaderInfo;
