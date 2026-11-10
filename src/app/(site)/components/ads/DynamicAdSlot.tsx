/* eslint-disable no-undef */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import AdSenseBanner from './AdSenseBanner';
import { isUsableAd, type AdConfig } from './adConfig';

export default function DynamicAdSlot({
  adConfig,
  className,
  style,
}: {
  adConfig: AdConfig | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!isUsableAd(adConfig)) {
    return null;
  }

  // Renderiza o anúncio do AdSense
  if (adConfig.ad_type === 'adsense' && adConfig.adsense_client_id && adConfig.adsense_slot_id) {
    return (
      <AdSenseBanner
        dataAdClient={adConfig.adsense_client_id}
        dataAdSlot={adConfig.adsense_slot_id}
        className={className}
        style={style || { display: 'block', width: '100%' }}
      />
    );
  }

  // Renderiza o anúncio particular (custom)
  if (adConfig.ad_type === 'custom' && adConfig.custom_image_url && adConfig.custom_link_url) {
    return (
      <Link
        href={adConfig.custom_link_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full ${className || ''}`}
        style={style}
      >
        <Image
          src={adConfig.custom_image_url}
          alt={adConfig.custom_alt_text || 'Anúncio'}
          width={970}
          height={90}
          unoptimized
          className="rounded-lg object-cover w-full h-auto"
        />
      </Link>
    );
  }

  return null;
}
