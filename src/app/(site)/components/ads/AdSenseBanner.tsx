/* eslint-disable no-console */
/* eslint-disable no-undef */
'use client';

import { useEffect, useRef } from 'react';

interface AdSenseBannerProps {
  dataAdClient: string;
  dataAdSlot: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseBanner({
  dataAdClient,
  dataAdSlot,
  className,
  style = { display: 'block' },
}: AdSenseBannerProps) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSenseBanner Error:', err);
    }
  }, [dataAdSlot]);

  return (
    <div className={className} key={dataAdSlot}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={style}
        data-ad-client={dataAdClient}
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
