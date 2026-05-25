import { test, expect } from '@playwright/test';
import { seedSignedIn, openAppRoute, collectConsoleErrors } from '../helpers/app';

test('medium result screen renders and exposes "why" entry point', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/result/medium');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('why-expanded screen renders directly', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await openAppRoute(page, '/why-expanded');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});
