import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, waitForBoot } from '../helpers/app';

// Visual regression — intentionally narrow. Update with:
//   npm run test:update-snapshots
// after an intentional design change, and review the diff in PR.

test.describe('@regression visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await seedSignedIn(page);
  });

  test('design-spec canvas', async ({ page }) => {
    await page.goto('/design-spec.html');
    await waitForBoot(page);
    await page.evaluate(() => (document as any).fonts?.ready);
    await expect(page).toHaveScreenshot('design-spec.png', { fullPage: true });
  });

  test('components gallery', async ({ page }) => {
    await page.goto('/components.html');
    await waitForBoot(page);
    await page.evaluate(() => (document as any).fonts?.ready);
    await expect(page).toHaveScreenshot('components.png', { fullPage: true });
  });

  for (const scenario of ['clean', 'medium', 'high'] as const) {
    test(`app result — ${scenario}`, async ({ page }) => {
      await openAppRoute(page, `/result/${scenario}`);
      await page.evaluate(() => (document as any).fonts?.ready);
      // Wait out the route-fade-in animation (200ms) plus a safety margin.
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`result-${scenario}.png`, { fullPage: true });
    });
  }
});
