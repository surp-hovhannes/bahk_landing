import { expect, test } from '@playwright/test';

test('Bible study overview links to sessions and day navigation works', async ({ page }) => {
  await page.goto('/bible-studies');

  await expect(page.getByRole('heading', { name: 'Guided Bible Studies' })).toBeVisible();
  await page.getByRole('link', { name: /Fast of Elijah/ }).click();

  await expect(page.getByRole('heading', { name: 'Fast of Elijah' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible();

  await page.getByRole('link', { name: /The Spirit of Communion and Love/ }).click();

  await expect(page.getByText('Fast of Elijah · Day 1 of 5')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Spirit of Communion and Love' })).toBeVisible();

  await page.getByRole('link', { name: /Day 2: You Shall Have No Other Gods Before Me/ }).click();

  await expect(page).toHaveURL(/\/bible-studies\/fast-of-elijah\/2\/$/);
  await expect(page.getByText('Fast of Elijah · Day 2 of 5')).toBeVisible();
  await expect(page.getByRole('link', { name: /Day 1: The Spirit of Communion and Love/ })).toBeVisible();
});
