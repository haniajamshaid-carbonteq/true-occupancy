import { test, expect } from '@playwright/test';
import { HOSTS, seedSignedIn, waitForBoot, collectConsoleErrors } from '../helpers/app';

test.describe('@smoke pages boot', () => {
  for (const host of HOSTS) {
    test(`${host} boots without console errors`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await seedSignedIn(page);
      await page.goto(`/${host}`);
      await waitForBoot(page);
      await expect(page).toHaveTitle(/True Occupancy/i);
      await expect(page.locator('#boot-status.error')).toHaveCount(0);
      expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
    });
  }
});
