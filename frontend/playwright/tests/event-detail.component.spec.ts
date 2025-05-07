import { test, expect } from '@playwright/test';

test.describe('Event Detail Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events/99');
  });


  test('should display event metadata (name, date, location)', async ({ page }) => {
    await expect(page.locator('.event-label', { hasText: 'Ürituse nimi:' })).toBeVisible();
    await expect(page.locator('.event-label', { hasText: 'Toimumisaeg:' })).toBeVisible();
    await expect(page.locator('.event-label', { hasText: 'Koht:' })).toBeVisible();
  });

  test('should list participants with correct info', async ({ page }) => {
    const participants = page.locator('.participant-row');
    await expect(participants).toHaveCount(2); // Alice and Bob from seed data

    // Verify first participant (Alice)
    const firstRow = participants.first();
    await expect(firstRow.locator('.participant-col.number')).toHaveText('1.');
    await expect(firstRow.locator('.participant-col.name')).toHaveText('Alice Kask');
    await expect(firstRow.locator('.participant-col.code')).toHaveText('12345678901');
    await expect(firstRow.locator('.participant-col.actions button')).toHaveAttribute('title', 'Kustuta osavõtja');

    // Verify second participant (Bob)
    const secondRow = participants.nth(1);
    await expect(secondRow.locator('.participant-col.number')).toHaveText('2.');
    await expect(secondRow.locator('.participant-col.name')).toHaveText('Bob Mets');
    await expect(secondRow.locator('.participant-col.code')).toHaveText('36001195716');
  });

  test('should allow deleting a participant', async ({ page }) => {
    const participants = page.locator('.participant-row');
    await expect(participants).toHaveCount(2); // Initial count: Alice and Bob

    // Open delete modal for first participant (Alice)
    await participants.first().locator('.participant-col.actions button').click();

    // Verify modal content
    await expect(page.locator('.modal-body p')).toContainText('Kas soovite osavõtja "Alice Kask" kustutada?');

    // Confirm deletion
    await page.locator('.modal-button.confirm-button').click();

    // Verify participant is removed
    await expect(participants).toHaveCount(1); // Only Bob remains
    await expect(participants.first().locator('.participant-col.name')).toHaveText('Bob Mets');

    // Verify modal is closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });
  test('should navigate back to event list', async ({ page }) => {
    await page.locator('a.btn-grey').click();
    await expect(page).toHaveURL(/\/events$/);
  });

  test('should allow navigating to a participant detail page', async ({ page }) => {
    const participantLink = page.locator('.participant-col.name').first();
    await participantLink.click();
    await expect(page).toHaveURL(/\/participants\/\d+/);
  });

  test('should show "Osavõtjaid pole" when no participants exist', async ({ page }) => {
    // Mock no participants for event with ID 999 or ensure backend returns empty array
    await page.goto('/events/999');
    await expect(page.locator('.no-participants')).toHaveText('Osavõtjaid pole');
  });
});
