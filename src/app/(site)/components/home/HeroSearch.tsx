 
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from '@/app/(site)/components/SearchBar';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';

const CameraScanner = dynamic(() => import('../CameraScanner'), { ssr: false });

export default function HeroSearch() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { isMobile } = useDeviceDetection();

  return (
    <>
      <SearchBar onCameraClick={() => setIsScannerOpen(true)} showCameraButton={isMobile} />
      {isMobile && isScannerOpen && (
        <CameraScanner isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} />
      )}
    </>
  );
}
