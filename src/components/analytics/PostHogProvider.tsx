'use client';

import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function PostHogPageView() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string>('');

  useEffect(() => {
    if (!posthog) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    if (url === last.current) return;
    last.current = url;
    posthog.capture('$pageview', {
      $current_url: typeof window !== 'undefined' ? window.location.href : url,
    });
  }, [pathname, searchParams, posthog]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (!key) {
    return <>{children}</>;
  }

  return (
    <PHProvider
      apiKey={key}
      options={{
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      }}
    >
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
