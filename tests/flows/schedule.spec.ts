import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, collectConsoleErrors } from '../helpers/app';

test('scheduled list renders', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/scheduled');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('schedule detail renders for a known id', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/scheduled/s01');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});
