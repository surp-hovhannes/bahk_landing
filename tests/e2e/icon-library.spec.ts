import { expect, test } from '@playwright/test';

const icons = [
  {
    id: 101,
    title: 'Nativity of Christ',
    church_name: 'St. John Armenian Church',
    tag_list: ['Nativity', 'Christ', 'Feast'],
    thumbnail_url: '',
    image: '',
  },
  {
    id: 102,
    title: 'St. Gregory the Illuminator',
    church_name: 'Armenian Apostolic Church',
    tag_list: ['Saints', 'Armenian'],
    thumbnail_url: '',
    image: '',
  },
];

test('icon library loads, searches, and renders API results', async ({ page }) => {
  let requestedSearch = '';

  await page.route('https://api.fastandpray.app/api/icons/?**', async (route) => {
    const url = new URL(route.request().url());
    requestedSearch = url.searchParams.get('search') ?? '';

    await route.fulfill({
      json: {
        count: icons.length,
        next: null,
        previous: null,
        results: icons,
      },
    });
  });

  await page.goto('/icons');

  await expect(page.getByRole('heading', { name: 'Fast & Pray Icon Library' })).toBeVisible();
  await expect(page.getByText('2 icons in the library')).toBeVisible();
  await expect(page.getByRole('link', { name: /Nativity of Christ/ })).toBeVisible();

  await page.getByPlaceholder(/Search icons/).fill('Gregory');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect.poll(() => requestedSearch).toBe('Gregory');
  await expect(page.getByText('2 results for "Gregory"')).toBeVisible();
  await expect(page.getByRole('link', { name: /St. Gregory the Illuminator/ })).toBeVisible();
});

test('AI match posts the prompt and renders confidence badges', async ({ page }) => {
  let requestBody: unknown;

  await page.route('https://api.fastandpray.app/api/icons/?**', async (route) => {
    await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } });
  });

  await page.route('https://api.fastandpray.app/api/icons/match/', async (route) => {
    requestBody = route.request().postDataJSON();

    await route.fulfill({
      json: {
        matches: [
          {
            icon: icons[0],
            confidence: 'high',
          },
        ],
      },
    });
  });

  await page.goto('/icons');
  await page.getByPlaceholder(/Search icons/).fill('baby Jesus icon');
  await page.getByRole('button', { name: /AI Match/ }).click();

  await expect.poll(() => requestBody).toMatchObject({
    prompt: 'baby Jesus icon',
    return_format: 'full',
    max_results: 9,
  });
  await expect(page.getByText('AI found 1 match for "baby Jesus icon"')).toBeVisible();
  await expect(page.getByTestId('confidence-badge')).toHaveText('● high');
});
