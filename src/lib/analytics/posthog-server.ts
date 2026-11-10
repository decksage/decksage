import { PostHog } from 'posthog-node';
import type { AnalyticsEventName } from './events';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/** Fire-and-forget server-side capture (Server Actions, Route Handlers). */
export function captureServer(
  distinctId: string,
  event: AnalyticsEventName,
  properties?: Record<string, unknown>,
): void {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({
      distinctId,
      event,
      properties: properties ?? {},
    });
  } catch {
    // non-fatal
  }
}

export async function shutdownPostHogServer(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
