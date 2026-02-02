'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DynamicAdSlot from './DynamicAdSlot';

interface StickyFooterAdProps {
    adConfig: any;
}

export default function StickyFooterAd({ adConfig }: StickyFooterAdProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !adConfig) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 shadow-2xl transition-transform duration-500 ease-in-out">
            <div className="relative w-full max-w-[970px] mx-auto py-2">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-10 right-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-full p-1.5 border border-neutral-700 shadow-md transition-colors"
                    aria-label="Fechar anúncio"
                >
                    <X size={16} />
                </button>
                <div className="flex justify-center min-h-[50px] sm:min-h-[90px]">
                    <DynamicAdSlot adConfig={adConfig} className="mx-auto" />
                </div>
            </div>
        </div>
    );
}
