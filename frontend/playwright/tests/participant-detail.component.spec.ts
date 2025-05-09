import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../scripts/global-setup';

test.describe('Participant Details Form', () => {
  // Base URL for the Angular application
  const BASE_URL = 'http://localhost:4200';
  const EVENT_LIST_URL = `${BASE_URL}/events`;

  test.beforeAll(async () => {
    await seedDatabase();
  });

  test.afterAll(async () => {
    await clearDatabase();
  });

  // Navigate from event list to first event, then first participant before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to event list page
    await page.goto(EVENT_LIST_URL);

    // Verify event list is loaded
    await expect(page.locator('.event-section-header').first()).toHaveText('Tulevased üritused');

    // Click the first future event (Future Conference, ID: 1)
    await page.locator('.event-list .event-title').first().click();

    // Verify navigation to event details page
    await expect(page).toHaveURL(`${BASE_URL}/events/99`);

    // Verify event details are loaded
    await expect(page.locator('.card-header')).toHaveText('Osavõtjad');

    // Click the first participant
    await page.locator('.participant-row .participant-col.name').first().click();
  });

  test('should render the form with initial state for editing a PERSON', async ({ page }) => {
    // Verify the form header
    await expect(page.locator('h2')).toHaveText('Osavõtja info');

    // Verify PERSON radio button is selected and disabled (edit mode)
    await expect(page.locator('#personType')).toBeChecked();
    await expect(page.locator('#personType')).toHaveAttribute('disabled', '');

    // Verify PERSON fields are visible and populated with Alice's data
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#firstName')).toHaveValue('Bob');
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#lastName')).toHaveValue('Mets');
    await expect(page.locator('#personalCode')).toBeVisible();
    await expect(page.locator('#personalCode')).toHaveValue('36001195716');

    // Verify COMPANY fields are not visible
    await expect(page.locator('#companyName')).not.toBeVisible();
    await expect(page.locator('#registrationCode')).not.toBeVisible();
    await expect(page.locator('#participantCount')).not.toBeVisible();

    // Verify payment method and additional info fields
    await expect(page.locator('#paymentMethod')).toBeVisible();
    await expect(page.locator('#additionalInfo')).toBeVisible();
  });

  test('should display validation errors on invalid form submission', async ({ page }) => {
    // Clear required fields
    await page.locator('#lastName').fill('');
    await page.locator('#personalCode').fill('');
    await page.locator('#paymentMethod').selectOption('');
    await page.locator('#firstName').fill('');

    // Submit the form
    await page.locator('button.btn-blue').click();

    // Verify error messages for required PERSON fields
    const errorMessages = await page.locator('div.error-msg').allTextContents();
    expect(errorMessages).toEqual(
      expect.arrayContaining([" Eesnimi on kohustuslik ",
        " Perekonnanimi on kohustuslik ",
        " Isikukood on kohustuslik ",
        " Maksmisviis on kohustuslik "])
    );

    // Verify general form error
    await expect(page.locator('.alert.alert-danger')).toHaveText('Palun täitke kohustuslikud väljad korrektselt');
  });

  test('should update a PERSON form successfully', async ({ page }) => {
    // Update PERSON form fields
    await page.locator('#firstName').fill('Alice');
    await page.locator('#lastName').fill('Kask');
    await page.locator('#personalCode').fill('61301185254'); // Unique personal code
    await page.locator('#paymentMethod').selectOption('CARD');
    await page.locator('#additionalInfo').fill('Updated info for Alice');

    // Submit the form
    await page.locator('button.btn-blue').click();

    // Verify the participant was updated
    // Verify event list is loaded
    await expect(page.locator('.event-section-header').first()).toHaveText('Tulevased üritused');

    // Click the first future event (Future Conference, ID: 1)
    await page.locator('.event-list .event-title').first().click();

    // Verify navigation to event details page
    await expect(page).toHaveURL(`${BASE_URL}/events/99`);

    // Verify event details are loaded
    await expect(page.locator('.card-header')).toHaveText('Osavõtjad');

    await expect(page.locator('.participant-row .participant-col.name').last()).toHaveText('Alice Kask');
    await expect(page.locator('.participant-row .participant-col.code').last()).toHaveText('61301185254');
  });

  test('should navigate back to participants list', async ({ page }) => {
    // Click the "Tagasi" button
    await page.locator('a.btn-grey').click();

    // Verify navigation to a route under events/*
    await expect(page).toHaveURL(/events\/*/);
  });
});

