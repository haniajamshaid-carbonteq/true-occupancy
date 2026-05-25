import { test, expect } from '@playwright/test';
import { seedSignedIn, waitForBoot, collectConsoleErrors } from '../helpers/app';

const SECTION_TITLES = ['Type ramp', 'Button', 'Pill', 'Card', 'RiskBadge'];

test('@smoke components.html renders core gallery sections', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedSignedIn(page);
  await page.goto('/components.html');
  await waitForBoot(page);
  for (const title of SECTION_TITLES) {
    await expect(
      page.getByRole('heading', { name: title, level: 2, exact: true }),
      `gallery section "${title}" missing`,
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
