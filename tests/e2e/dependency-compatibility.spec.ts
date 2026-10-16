import { expect, test } from '@playwright/test';

test('Netlify image middleware rasterizes the site favicon with patched Sharp', async ({ request }) => {
  const response = await request.get('/.netlify/images?url=/favicon.svg&w=32&fm=png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  const png = await response.body();
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(32);
  expect(png.readUInt32BE(20)).toBe(32);
  expect((await request.get('/.netlify/images?url=https://example.invalid/untrusted.svg')).status()).toBe(403);
});

test('blog typography remains readable at desktop and mobile widths', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/welcome/');
    const article = page.locator('article.prose');
    await expect(article.getByRole('heading', { level: 1 })).toHaveText('Welcome to the Fast & Pray Blog');
    await expect(article.getByText('Stay tuned—more posts coming soon.')).toBeVisible();
    const metrics = await article.evaluate(element => {
      const paragraph = getComputedStyle(element.querySelector('p:last-child')!);
      return {
        fontSize: parseFloat(paragraph.fontSize),
        lineHeight: parseFloat(paragraph.lineHeight),
        headingSize: parseFloat(getComputedStyle(element.querySelector('h1')!).fontSize),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(metrics).toEqual({ fontSize: 16, lineHeight: 28, headingSize: 36, overflow: false });
  }
  expect(errors).toEqual([]);
});
