import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, collectConsoleErrors } from '../helpers/app';

test('high-risk result screen renders factor + listings panels', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/result/high');
  await expect(page.locator('#root')).not.toBeEmpty();
  // High-risk result mounts ListingsPanel — at least one platform name
  // (Airbnb / Vrbo / Facebook) should appear somewhere on the page.
  await expect(page.getByText(/Airbnb|Vrbo|Facebook/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});
