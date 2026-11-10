'use client';

import { useEffect } from 'react';
import { captureClient } from '@/lib/analytics/client';
import { AnalyticsEvents } from '@/lib/analytics/events';

export default function BlogEngagement({ slug }: { slug: string }) {
  useEffect(() => {
    captureClient(AnalyticsEvents.BLOG_POST_READ, { slug });
  }, [slug]);
  return null;
}
