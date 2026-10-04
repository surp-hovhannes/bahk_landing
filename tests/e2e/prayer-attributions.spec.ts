import { test, expect } from '@playwright/test';

test('existing team entry leads to canonical Narek source', async ({ page }) => {
  await page.goto('/team');
  await expect(page.getByText('Tom Samuelian', { exact: true })).toHaveCount(1);
  await page.getByRole('link', { name: 'Narek source and acknowledgment' }).click();
  await expect(page).toHaveURL(/prayer-attributions\/#narek-samuelian-2021$/);
  await expect(page.locator('#narek-samuelian-2021')).toBeVisible();
  await expect(page.locator('footer').getByRole('link', { name: 'Prayer Sources & Acknowledgments' })).toHaveCount(0);
});

test('credits are readable without JavaScript on mobile and by keyboard', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/prayer-attributions/');
  const credit = page.locator('.source-credit');
  for (const text of ['Thomas J. Samuelian', 'Diana Der Hovanessian', '2021 revised edition', 'English translation used by permission']) await expect(credit).toContainText(text);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prayer Sources & Acknowledgments');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const source = page.getByRole('link', { name: 'arak29.org — Translator’s colophon' });
  await expect(source).toHaveAttribute('href', 'https://www.arak29.org/stgregoryofnarek/about.php');
  await expect(page.getByRole('link', { name: 'arak29.org — Introduction and revised-edition notes' })).toHaveAttribute('href', 'https://www.arak29.org/stgregoryofnarek/intro.php');
  for (let i = 0; i < 30 && !(await source.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(source).toBeFocused();
  expect(await source.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await context.close();
});

test('unattributed studies have no empty credit blocks', async ({ page }) => {
  await page.goto('/bible-studies/fast-of-elijah/1/');
  await expect(page.locator('.source-credit')).toHaveCount(0);
  await page.goto('/bible-studies/fast-of-elijah/');
  await expect(page.locator('.source-credit')).toHaveCount(0);
});

test('credit typography meets readable size and contrast', async ({ page }) => {
  await page.goto('/prayer-attributions/');
  const metrics = await page.locator('.source-credit').evaluate((el) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    function luminance(color: string) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const rgb = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3).map((value) => {
        const c = value / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    }
    const background = luminance(getComputedStyle(document.querySelector('main')!).backgroundColor);
    const contrast = (color: string) => {
      const foreground = luminance(color);
      return (Math.max(background, foreground) + .05) / (Math.min(background, foreground) + .05);
    };
    return { size: parseFloat(getComputedStyle(el).fontSize), text: contrast(getComputedStyle(el).color), link: contrast(getComputedStyle(el.querySelector('a')!).color) };
  });
  expect(metrics.size).toBeGreaterThanOrEqual(16);
  expect(metrics.text).toBeGreaterThanOrEqual(4.5);
  expect(metrics.link).toBeGreaterThanOrEqual(4.5);
});
