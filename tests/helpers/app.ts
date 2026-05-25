import { expect, Page } from '@playwright/test';

export const HOSTS = ['app.html', 'design-spec.html', 'states-spec.html', 'components.html'] as const;
export type Host = (typeof HOSTS)[number];

/**
 * Bypass AuthGate by seeding the signed-in sessionStorage flag for the
 * localhost origin before navigating. Without this, every non-auth route
 * redirects to /signin.
 */
export async function seedSignedIn(page: Page) {
  await page.addInitScript(() => {
    try { window.sessionStorage.setItem('to-signedIn', '1'); } catch {}
  });
}

/**
 * The boot script in each HTML host renders a `#boot-status` element. On
 * success it removes the element; on failure it adds `.error` and leaves
 * the element in the DOM with a message. We treat "node detached" as the
 * canonical "app booted" signal.
 */
export async function waitForBoot(page: Page, timeout = 20_000) {
  await page.waitForFunction(
    () => {
      const status = document.getElementById('boot-status');
      if (status?.classList.contains('error')) {
        throw new Error('boot failed: ' + (status.textContent ?? ''));
      }
      const root = document.getElementById('root');
      // Booted = React has committed at least one child into #root.
      return !!root && root.children.length > 0;
    },
    null,
    { timeout },
  );
}

/**
 * Open a HashRouter route inside app.html. Pass paths without the `#`.
 * Example: openAppRoute(page, '/result/high')
 */
export async function openAppRoute(page: Page, route: string) {
  const hash = route.startsWith('/') ? route : `/${route}`;
  await page.goto(`/app.html#${hash}`);
  await waitForBoot(page);
}

/**
 * Collect console errors. Pass the returned array into an assertion at end
 * of test to fail on any logged Error-level message. Filters known noise
 * (network 404s for hot-reload pings, etc. — currently empty, room to grow).
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  const ignore: RegExp[] = [
    // Tailwind Play CDN logs a "should not be used in production" warning.
    /cdn\.tailwindcss\.com should not be used in production/i,
  ];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ignore.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
