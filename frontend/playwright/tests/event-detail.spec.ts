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
    await expect(participants.count()).resolves.toBeGreaterThan(0);

    // Check presence of participant columns
    const firstRow = participants.first();
    await expect(firstRow.locator('.participant-col.number')).toContainText('1.');
    await expect(firstRow.locator('.participant-col.name')).not.toBeEmpty();
    await expect(firstRow.locator('.participant-col.code')).not.toBeEmpty();
    await expect(firstRow.locator('.participant-col.actions a')).toHaveText('KUSTUTA');
  });

  test('should allow deleting a participant', async ({ page }) => {
    const rows = page.locator('.participant-row');
    const initialCount = await rows.count();

    if (initialCount > 0) {
      await rows.nth(0).locator('.participant-col.actions a').click();
      await expect(rows).toHaveCount(initialCount - 1);
    }
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
