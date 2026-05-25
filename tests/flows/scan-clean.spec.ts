import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, collectConsoleErrors } from '../helpers/app';

test('@smoke clean result screen renders', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/result/clean');
  await expect(page.locator('#root')).toBeVisible();
  // The clean result hero verdict reads "Not rented" (low signal scenario).
  await expect(page.getByText(/not rented/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});
