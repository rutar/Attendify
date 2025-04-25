import { test, expect, Page } from '@playwright/test';
import { clearDatabase } from '../scripts/global-setup'
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface EventData {
  id?: number;
  name: string;
  dateTime: string;
  location?: string;
  totalParticipants: number;
  status: string;
  additionalInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

const expectedFutureEvents: EventData[] = [
  {
    id: 1,
    name: 'Future Conference',
    dateTime: new Date('2025-04-26T10:00:00Z').toISOString(),
    location: 'Tallinn',
    totalParticipants: 45,
    status: 'upcoming',
    additionalInfo: 'Annual tech conference',
  },
  {
    id: 2,
    name: 'Tech Meetup',
    dateTime: new Date('2025-04-27T15:00:00Z').toISOString(),
    location: 'Tartu',
    totalParticipants: 20,
    status: 'upcoming',
    additionalInfo: '',
  },
];

const expectedPastEvents: EventData[] = [
  {
    id: 3,
    name: 'Past Workshop',
    dateTime: new Date('2025-04-24T12:00:00Z').toISOString(),
    location: 'Pärnu',
    totalParticipants: 30,
    status: 'completed',
    additionalInfo: 'Web development workshop',
  },
];

test.describe('EventListComponent', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Log network requests
    page.on('request', (request) => {
      console.log('Network request:', request.url());
    });

    // Log console and page errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    page.on('pageerror', (err) => {
      console.log('Page error:', err);
    });

    // Navigate and wait for API response
    const apiResponsePromise = page.waitForResponse('http://localhost:8080/api/events');
    await page.goto('/events', { waitUntil: 'networkidle' });
    await apiResponsePromise;
  });

  test('should display future and past events', async () => {
    // Wait for events to render
    await page.waitForFunction(() => document.querySelector('.event-list li') !== null, { timeout: 20000 }).catch(async (err) => {
      console.error('Timeout waiting for events:', err);
      console.log('Page HTML:', await page.content());
      await page.screenshot({ path: 'screenshot.png' });
    });

    // Log component state
    await page.evaluate(() => {
      const component = document.querySelector('app-event-list') as any;
      console.log('Component future events:', component?.futureEvents?.() || 'No future events');
      console.log('Component past events:', component?.pastEvents?.() || 'No past events');
    });

    // Log DOM state
    console.log('Future section header:', await page.locator('.event-section-header').first().textContent());
    console.log('Past section header:', await page.locator('.event-section-header').last().textContent());
    const futureEventsList = page.locator('.event-card').first().locator('.event-list li');
    console.log('Future events count:', await futureEventsList.count());
    const pastEventsList = page.locator('.event-card').last().locator('.event-list li');
    console.log('Past events count:', await pastEventsList.count());

    // Check section headers
    await expect(page.locator('.event-section-header').first()).toHaveText('Tulevased üritused');
    await expect(page.locator('.event-section-header').last()).toHaveText('Toimunud üritused');

    // Check future events
    await expect(futureEventsList).toHaveCount(expectedFutureEvents.length);

    // Check first future event details
    const firstFutureEvent = futureEventsList.first();
    await expect(firstFutureEvent.locator('.event-title')).toHaveText(expectedFutureEvents[0].name);
    await expect(firstFutureEvent.locator('.event-location')).toHaveText(expectedFutureEvents[0].location || '');
    await expect(firstFutureEvent.locator('.event-participants-count')).toHaveText(expectedFutureEvents[0].totalParticipants.toString());

    // Check past events
    await expect(pastEventsList).toHaveCount(expectedPastEvents.length);

    // Check first past event details
    const firstPastEvent = pastEventsList.first();
    await expect(firstPastEvent.locator('.event-title')).toHaveText(expectedPastEvents[0].name);
    await expect(firstPastEvent.locator('.event-location')).toHaveText(expectedPastEvents[0].location || '');
    await expect(firstPastEvent.locator('.event-participants-count')).toHaveText(expectedPastEvents[0].totalParticipants.toString());
  });

  test('should navigate to event details when clicking on event title', async () => {
    // Click on first future event title
    const firstFutureEventTitle = page.locator('.event-card').first().locator('.event-title').first();
    await firstFutureEventTitle.click();

    // Check URL
    await expect(page).toHaveURL(`/events/${expectedFutureEvents[0].id}`);
  });

  test('should navigate to add participant form when clicking add button', async () => {
    // Click on add participant button for first future event
    const addButton = page.locator('.event-card').first().locator('.add-participant-button').first();
    await addButton.click();

    // Check URL
    await expect(page).toHaveURL(`/events/${expectedFutureEvents[0].id}/new`);
  });

  test('should open delete modal when clicking delete button', async () => {
    // Initially, the modal should not be visible
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // Click delete button for first future event
    const deleteButton = page.locator('.event-card').first().locator('.delete-button').first();
    await deleteButton.click();

    // Check that modal appears with correct event name
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-body p')).toContainText(expectedFutureEvents[0].name);
  });

  test('should close delete modal when clicking cancel button', async () => {
    // Open the modal first
    const deleteButton = page.locator('.event-card').first().locator('.delete-button').first();
    await deleteButton.click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // Click cancel button
    await page.locator('.cancel-button').click();

    // Check that modal is closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should close delete modal when pressing Escape key', async () => {
    // Open the modal first
    const deleteButton = page.locator('.event-card').first().locator('.delete-button').first();
    await deleteButton.click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Check that modal is closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should delete event when confirming deletion', async () => {
    // Open the modal first
    const deleteButton = page.locator('.event-card').first().locator('.delete-button').first();
    await deleteButton.click();

    // Count events before deletion
    const futureEventsList = page.locator('.event-card').first().locator('.event-list li');
    const futureEventsCountBefore = await futureEventsList.count();

    // Click confirm button and wait for delete request
    const deleteResponsePromise = page.waitForResponse(`http://localhost:8080/api/events/${expectedFutureEvents[0].id}`);
    await page.locator('.confirm-button').click();
    await deleteResponsePromise;

    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // Wait for events to reload
    await page.waitForResponse('http://localhost:8080/api/events');

    // Check that one event was removed
    await expect(futureEventsList).toHaveCount(futureEventsCountBefore - 1);
  });

  test('should show error message when event loading fails', async () => {
    // Stop backend to simulate failure
    await execPromise('docker-compose -f ../backend/docker-compose.yml stop backend', { cwd: process.cwd() });

    await page.goto('/events');

    // Check error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Ürituste laadimine ebaõnnestus');

    // Restart backend
    await execPromise('docker-compose -f ../backend/docker-compose.yml start backend', { cwd: process.cwd() });
    await waitForBackend();
  });

  test('should navigate to new event page when clicking "Lisa üritus"', async () => {
    // Click on "Lisa üritus" link
    await page.locator('.add-event-link').click();

    // Check URL
    await expect(page).toHaveURL('/events/new');
  });

  test('should show empty message when no events available', async () => {
    // Clear database
    await clearDatabase();

    await page.goto('/events');

    // Check empty messages
    await expect(page.locator('.event-card').first().locator('.empty-message')).toHaveText('Tulevasi üritusi pole');
    await expect(page.locator('.event-card').last().locator('.empty-message')).toHaveText('Toimunud üritusi pole');
  });

});



async function waitForBackend() {
  const maxAttempts = 30;
  const delay = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:8080/api/events');
      if (response.ok) return;
    } catch (err) {
      // Ignore errors during startup
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Backend did not start in time');
}
