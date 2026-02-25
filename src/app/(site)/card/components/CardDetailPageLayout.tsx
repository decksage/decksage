import React, { ReactNode } from 'react';

interface CardDetailPageLayoutProps {
  children: ReactNode;
}

const CardDetailPageLayout = ({ children }: CardDetailPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">{children}</div>
    </div>
  );
};

export default CardDetailPageLayout;
