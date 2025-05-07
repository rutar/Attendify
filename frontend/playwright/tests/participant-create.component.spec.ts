import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../scripts/global-setup';

test.describe('Participant Creation Form', () => {
  test.beforeAll(async () => {
    await seedDatabase();
  });

  test.afterAll(async () => {
    await clearDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/events/99/new');
  });

  test('should display error when event fetch fails with 404', async ({ page }) => {
    // Navigate to participant creation page
    await page.goto('http://localhost:4200/events/9/new');

    // Verify error message for failed event fetch
    await expect(page.locator('.alert-danger', { hasText: 'Ürituse andmete laadimine ebaõnnestus' })).toBeVisible();

    // Verify form is still accessible despite event fetch failure
    await expect(page.getByLabel('Eraisik')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvesta' })).toBeVisible();
  });

  test('should add a new person participant successfully', async ({ page }) => {
    // Select participant type
    await page.getByLabel('Eraisik').check();

    // Fill person details
    await page.getByLabel('Eesnimi:').fill('John');
    await page.getByLabel('Perenimi:').fill('Doe');
    await page.getByLabel('Isikukood:').fill('39702016030');
    await page.getByLabel('Maksmisviis').selectOption('CARD');
    await page.getByLabel('Lisainfo:').fill('Test participant');

    // Submit form
    await page.getByRole('button', { name: 'Salvesta' }).click();

    // Verify navigation to events page
    await expect(page).toHaveURL('http://localhost:4200/events');
  });

  test('should add a new company participant successfully', async ({ page }) => {
    // Select company type
    await page.getByLabel('Ettevõte').check();

    // Fill company details
    await page.getByLabel('Ettevõtte nimi:').fill('Tech Corp');
    await page.getByLabel('Registrikood:').fill('98765432');
    await page.getByLabel('Osalejate arv:').fill('5');
    await page.getByLabel('Maksmisviis').selectOption('BANK_TRANSFER');
    await page.getByLabel('Lisainfo:').fill('Company registration');

    // Submit form
    await page.getByRole('button', { name: 'Salvesta' }).click();

    // Verify navigation to events page
    await expect(page).toHaveURL('http://localhost:4200/events');
  });

  test('should show validation errors for person when required fields are empty', async ({ page }) => {
    // Select person type
    await page.getByLabel('Eraisik').check();

    // Submit form without filling required fields
    await page.getByRole('button', { name: 'Salvesta' }).click();

    // Verify error messages
    await expect(page.locator('.error-msg', { hasText: 'Eesnimi on kohustuslik' })).toBeVisible();
    await expect(page.locator('.error-msg', { hasText: 'Perekonnanimi on kohustuslik' })).toBeVisible();
    await expect(page.locator('.error-msg', { hasText: 'Isikukood on kohustuslik' })).toBeVisible();
    await expect(page.locator('.error-msg', { hasText: 'Maksmisviis on kohustuslik' })).toBeVisible();
    await expect(page.locator('.alert-danger', { hasText: 'Palun täitke kohustuslikud väljad korrektselt' })).toBeVisible();
  });

  test('should show validation errors for company when required fields are empty', async ({ page }) => {
    // Select company type
    await page.getByLabel('Ettevõte').check();

    // Submit form without filling required fields
    await page.getByRole('button', { name: 'Salvesta' }).click();

    // Verify error messages
    await expect(page.locator('.error-msg', { hasText: 'Ettevõtte nimi on kohustuslik' })).toBeVisible();
    await expect(page.locator('.error-msg', { hasText: 'Registrikood on kohustuslik' })).toBeVisible();
    await expect(page.locator('.error-msg', { hasText: 'Maksmisviis on kohustuslik' })).toBeVisible();
    await expect(page.locator('.alert-danger', { hasText: 'Palun täitke kohustuslikud väljad korrektselt' })).toBeVisible();
  });

  test('should show autocomplete suggestions for first name using real API', async ({ page }) => {
    // Select person type
    await page.getByLabel('Eraisik').check();

    // Type in first name to trigger autocomplete
    await page.getByLabel('Eesnimi:').fill('Ali');

    // Wait for autocomplete options
    await page.waitForSelector('.mat-mdc-option', { timeout: 5000 });

    // Verify autocomplete contains expected participant from seeded data
    await expect(page.locator('.mat-mdc-option', { hasText: 'Alice Kask (61110095270)' })).toBeVisible();

    // Select autocomplete option
    await page.locator('.mat-mdc-option', { hasText: 'Alice Kask (61110095270)' }).click();

    // Verify form fields are populated
    await expect(page.getByLabel('Eesnimi:')).toHaveValue('Alice');
    await expect(page.getByLabel('Perenimi:')).toHaveValue('Kask');
    await expect(page.getByLabel('Isikukood:')).toHaveValue('61110095270');
  });

  test('should handle existing participant (409 conflict)', async ({ page }) => {
    // Select person type
    await page.getByLabel('Eraisik').check();

    // Fill details for existing participant (Alice Kask from seed data)
    await page.getByLabel('Eesnimi:').fill('Carol');
    await page.getByLabel('Perenimi:').fill('Tamm');
    await page.getByLabel('Isikukood:').fill('46908049530');
    await page.getByLabel('Maksmisviis').selectOption('CARD');

    // Submit form
    await page.getByRole('button', { name: 'Salvesta' }).click();

    // Verify error message for already added participant
    await expect(page.locator('.alert-danger', { hasText: 'Osaleja on juba üritusele lisatud' })).toBeVisible();
  });

  test('should navigate back to events page when clicking Tagasi', async ({ page }) => {
    await page.getByRole('link', { name: 'Tagasi' }).click();
    await expect(page).toHaveURL('http://localhost:4200/events');
  });
});
