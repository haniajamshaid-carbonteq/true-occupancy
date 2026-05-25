import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, collectConsoleErrors } from '../helpers/app';

test('history screen renders heading', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/history');
  await expect(page.getByRole('heading', { name: /history/i, level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('batch list screen renders', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/batch');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('batch detail screen renders for a known id', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/batch/hb1');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});
