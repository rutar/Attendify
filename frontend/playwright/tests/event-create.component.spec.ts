import { test, expect } from '@playwright/test';

test.describe('Event Create Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events/new');
  });

  test('should display empty form fields initially', async ({ page }) => {
    await expect(page.getByLabel('Ürituse nimi:')).toHaveValue('');
    await expect(page.getByLabel('Toimumisaeg:')).toHaveValue('');
    await expect(page.getByLabel('Koht:')).toHaveValue('');
    await expect(page.getByLabel('Lisainfo:')).toHaveValue('');
  });

  test('should show required field errors when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Lisa' }).click();

    await expect(page.getByText('Ürituse nimi on kohustuslik')).toBeVisible();
    await expect(page.getByText('Toimumisaeg on kohustuslik')).toBeVisible();
    await expect(page.getByText('Koht on kohustuslik')).toBeVisible();
    await expect(page.getByText('Palun täida kohustuslikud väljad')).toBeVisible();
  });

  test('should show error when date is in the past', async ({ page }) => {
    const pastDate = new Date(Date.now() - 86400000).toISOString().slice(0, 16); // yesterday

    await page.getByLabel('Ürituse nimi:').fill('Test Event');
    await page.getByLabel('Toimumisaeg:').fill(pastDate);
    await page.getByLabel('Koht:').fill('Tallinn');

    await page.getByRole('button', { name: 'Lisa' }).click();

    await expect(page.locator('.alert.alert-danger')).toHaveText('Ürituse toimumisaeg ei tohi olla minevikus');
  });

  test('should submit successfully with valid data', async ({ page }) => {
    const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16); // tomorrow

    // Intercept the request to validate content and simulate a 200 OK
    await page.route('**/api/events', async route => {
      const request = await route.request().postDataJSON();
      expect(request.name).toBe('Conference');
      expect(request.location).toBe('Tartu');
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
        contentType: 'application/json',
      });
    });

    await page.getByLabel('Ürituse nimi:').fill('Conference');
    await page.getByLabel('Toimumisaeg:').fill(futureDate);
    await page.getByLabel('Koht:').fill('Tartu');
    await page.getByLabel('Lisainfo:').fill('Annual Tech Event');

    await Promise.all([
      page.waitForURL('**/events'),
      page.getByRole('button', { name: 'Lisa' }).click(),
    ]);
  });

  test('should show error message when server fails to create event', async ({ page }) => {
    const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);

    await page.route('**/api/events', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server Error' }),
        contentType: 'application/json',
      })
    );

    await page.getByLabel('Ürituse nimi:').fill('Failing Event');
    await page.getByLabel('Toimumisaeg:').fill(futureDate);
    await page.getByLabel('Koht:').fill('Narva');

    await page.getByRole('button', { name: 'Lisa' }).click();

    await expect(page.getByText('Ürituse lisamine ebaõnnestus')).toBeVisible();
  });

  test('should navigate back to event list when clicking "Tagasi"', async ({ page }) => {
    await Promise.all([
      page.waitForURL('**/events'),
      page.getByRole('link', { name: 'Tagasi' }).click(),
    ]);
  });
});
