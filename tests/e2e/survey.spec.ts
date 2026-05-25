import { expect, test } from '@playwright/test';

test('survey validates required sections, reveals follow-ups, and submits payload', async ({ page }) => {
  let submittedPayload: Record<string, string> | undefined;

  await page.route('https://czpmtdcjogaueynyyioi.supabase.co/rest/v1/fast_pray_survey_responses', async (route) => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({ status: 201, body: '' });
  });

  await page.goto('/survey');

  await expect(page.getByRole('heading', { name: 'Fast & Pray Research Survey' })).toBeVisible();
  await expect(page.getByText('Section 1 of 6')).toBeVisible();

  await page.getByRole('button', { name: 'Next Section' }).click();
  await expect(page.getByText('Section 1 of 6')).toBeVisible();

  await page.getByLabel('Less than 1 month').check();
  await page.getByLabel('Daily').check();
  await page.getByLabel('Consistent but seeking deeper growth').check();
  await page.getByLabel('Armenian Apostolic').check();
  await page.getByRole('button', { name: 'Next Section' }).click();

  await expect(page.getByText('Section 2 of 6')).toBeVisible();
  await page.getByRole('radio', { name: 'A lot', exact: true }).check();
  await expect(page.getByLabel('If yes, how?')).toBeVisible();
  await page.getByLabel('If yes, how?').fill('It helped me understand fasting as prayer.');
  await page.getByRole('button', { name: 'Next Section' }).click();

  await expect(page.getByText('Section 3 of 6')).toBeVisible();
  await page.getByLabel('It encourages me a lot').check();
  await page.getByRole('button', { name: 'Next Section' }).click();

  await expect(page.getByText('Section 4 of 6')).toBeVisible();
  await page.locator('input[name="q18"][value="Yes"]').check();
  await page.getByLabel('Keeping track of fast days').check();
  await page.locator('input[name="q20"][value="Time"]').check();
  await page.getByRole('button', { name: 'Next Section' }).click();

  await expect(page.getByText('Section 5 of 6')).toBeVisible();
  await page.getByLabel('Never').check();
  await page.getByRole('button', { name: 'Next Section' }).click();

  await expect(page.getByText('Section 6 of 6')).toBeVisible();
  await page.getByLabel('Yes, anonymously').check();
  await page.getByRole('button', { name: 'Submit Survey' }).click();

  await expect(page.getByText('Thank you. Your survey has been submitted.')).toBeVisible();
  expect(submittedPayload).toMatchObject({
    q01: 'Less than 1 month',
    q02: 'Daily',
    q03: 'Consistent but seeking deeper growth',
    q04: 'Armenian Apostolic',
    q13: 'A lot\nFollow-up: It helped me understand fasting as prayer.',
    q14: 'It encourages me a lot',
    q18: 'Yes',
    q19: 'Keeping track of fast days',
    q20: 'Time',
    q24: 'Never',
    q27: 'Yes, anonymously',
  });
});
