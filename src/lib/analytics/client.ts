'use client';

import posthog from 'posthog-js';
import type { AnalyticsEventName } from './events';

export function captureClient(event: AnalyticsEventName, properties?: Record<string, unknown>): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    if (typeof posthog.capture === 'function') {
      posthog.capture(event, properties ?? {});
    }
  } catch {
    // ignore
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.identify(userId, traits);
  } catch {
    // ignore
  }
}
