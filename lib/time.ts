import { headers } from 'next/headers';

export function getCurrentTime(): number {
  // Check if we're in test mode
  const isTestMode = process.env.TEST_MODE === '1';

  if (isTestMode) {
    // Try to get the test time from headers when in a Next request context.
    try {
      if (typeof headers === 'function') {
        const maybeHeaders = headers();
        // `headers()` may return a Promise in some environments/types — detect and skip if so.
        if (maybeHeaders && typeof (maybeHeaders as any).then === 'function') {
          // Can't synchronously read headers; fall through to env var fallback.
        } else {
          const headersList = maybeHeaders as unknown as { get?: (k: string) => string | null };
          const testNowMs = typeof headersList?.get === 'function' ? headersList.get('x-test-now-ms') : null;
          if (testNowMs) {
            const timestamp = Number(testNowMs);
            if (!Number.isNaN(timestamp)) return timestamp;
          }
        }
      }
    } catch {
      // `headers()` can throw outside of a Next request/route handler — ignore and fall back to env var.
    }

    // Fallback for test runners: support `TEST_NOW_MS` or `TEST_NOW` env vars.
    const envNow = process.env.TEST_NOW_MS ?? process.env.TEST_NOW;
    if (envNow) {
      const timestamp = Number(envNow);
      if (!Number.isNaN(timestamp)) return timestamp;
    }
  }

  // Return actual current time
  return Date.now();
}