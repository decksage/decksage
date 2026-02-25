import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CardDetailsDisplayProps {
  children: ReactNode;
}

const CardDetailsDisplay = ({ children }: CardDetailsDisplayProps) => {
  return (
    <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800 p-8 shadow-2xl rounded-2xl">
      <CardContent className="p-0 space-y-6">{children}</CardContent>
    </Card>
  );
};

export default CardDetailsDisplay;
