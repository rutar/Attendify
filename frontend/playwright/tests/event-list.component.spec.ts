import {expect, Page, test} from '@playwright/test';
import {clearDatabase} from '../scripts/global-setup'
import {exec} from 'child_process';
import {promisify} from 'util';
promisify(exec);
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
    id: 99,
    name: 'Future Conference',
    dateTime: new Date('2025-04-26T10:00:00Z').toISOString(),
    location: 'Tallinn',
    totalParticipants: 1,
    status: 'upcoming',
    additionalInfo: 'Annual tech conference',
  },
  {
    id: 2,
    name: 'Tech Meetup',
    dateTime: new Date('2025-04-27T15:00:00Z').toISOString(),
    location: 'Tartu',
    totalParticipants: 2,
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
    totalParticipants: 1,
    status: 'completed',
    additionalInfo: 'Web development workshop',
  },
];

test.describe('Event List Component', () => {
  let page: Page;

  test.beforeEach(async ({page: testPage}) => {
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
    await page.goto('/events', {waitUntil: 'networkidle'});
    await apiResponsePromise;
  });

  test('should display future and past events', async () => {
    try {
      // Wait for at least one list item to appear in the DOM
      await page.waitForSelector('.event-list li', { timeout: 20000 });

      // Verify section headers
      const headers = page.locator('.event-section-header');
      await expect(headers.nth(0)).toHaveText('Tulevased üritused');
      await expect(headers.nth(1)).toHaveText('Toimunud üritused');

      // Future events
      const futureEventsList = page.locator('.event-card').nth(0).locator('.event-list li');
      const futureCount = await futureEventsList.count();
      console.log('Future events count:', futureCount);
      await expect(futureEventsList).toHaveCount(expectedFutureEvents.length);

      const firstFuture = futureEventsList.nth(0);
      await expect(firstFuture.locator('.event-title')).toHaveText(expectedFutureEvents[0].name);
      await expect(firstFuture.locator('.event-location')).toHaveText(expectedFutureEvents[0].location ?? '');
      await expect(firstFuture.locator('.event-participants-count')).toHaveText(expectedFutureEvents[0].totalParticipants.toString());

      // Past events
      const pastEventsList = page.locator('.event-card').nth(1).locator('.event-list li');
      const pastCount = await pastEventsList.count();
      console.log('Past events count:', pastCount);
      await expect(pastEventsList).toHaveCount(expectedPastEvents.length);

      const firstPast = pastEventsList.nth(0);
      await expect(
        page.locator('.event-card').nth(1).locator('.event-list li').first().locator('.event-title-past')
      ).toHaveText(expectedPastEvents[0].name);
      await expect(firstPast.locator('.event-location')).toHaveText(expectedPastEvents[0].location ?? '');
      await expect(firstPast.locator('.event-participants-count')).toHaveText(expectedPastEvents[0].totalParticipants.toString());

    } catch (error) {
      console.error('Test failed:', error);
      console.log('Page HTML:', await page.content());
      await page.screenshot({ path: 'screenshot.png' });
      throw error; // Ensure test fails properly
    }
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
    // Wait for events to render
    await page.waitForSelector('.event-card .event-list li', {timeout: 20000});

    // Log network responses for debugging
    page.on('response', (response) => {
      console.log(`Response: ${response.url()} - Status: ${response.status()}`);
    });

    // Get the first event ID from the UI
    const firstFutureEventTitle = page.locator('.event-card').first().locator('.event-title').first();
    const href = await firstFutureEventTitle.getAttribute('href');
    if (!href) {
      throw new Error('Failed to get href attribute from .event-title');
    }
    const match = href.match(/\/events\/(\d+)/);
    if (!match) {
      throw new Error(`href "${href}" does not match expected pattern /events/\\d+`);
    }
    const eventId = match[1];

    // Open the delete modal
    const deleteButton = page.locator('.event-card').first().locator('.delete-button').first();
    await deleteButton.click();
    await expect(page.locator('.modal-overlay')).toBeVisible({timeout: 5000});

    // Count events before deletion
    const futureEventsList = page.locator('.event-card').first().locator('.event-list li');
    const futureEventsCountBefore = await futureEventsList.count();

    // Click confirm button and wait for DELETE request
    const deleteResponsePromise = page.waitForResponse(`http://localhost:8080/api/events/${eventId}`, {timeout: 10000});
    await page.locator('.confirm-button').click();
    const deleteResponse = await deleteResponsePromise;
    console.log(`DELETE response status: ${deleteResponse.status()}`);

    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible({timeout: 5000});

    // Wait for UI to update (signal-based, no network request)
    await page.waitForFunction(
      (countBefore) => {
        const list = document.querySelector('.event-card:first-child .event-list')?.querySelectorAll('li');
        return list && list.length === countBefore - 1;
      },
      futureEventsCountBefore,
      {timeout: 10000}
    );

    // Check that one event was removed
    await expect(futureEventsList).toHaveCount(futureEventsCountBefore - 1);
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


  test('should show error message when event loading fails', async () => {
    await page.route('**/api/events', route => {
      route.abort('failed'); // Simulate network failure
    });

    await page.goto('/events');

    // Check error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Ürituste laadimine ebaõnnestus');
  });
});
