import { test as base, Page, Request } from '@playwright/test';

export type TestUser = {
  email: string;
  password: string;
  displayName: string;
};

const TEST_USERS: Record<string, TestUser> = {
  primary: {
    email: 'test@example.com',
    password: 'TestPassword123',
    displayName: 'Test User',
  },
  opponent: {
    email: 'opponent@example.com',
    password: 'TestPassword123',
    displayName: 'Opponent User',
  },
};

/**
 * Waits for the page to be fully loaded (Firebase auth included)
 */
async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for Firebase to initialize by checking for the auth container
  // The auth pages render a form with class "auth-container" after Firebase initializes
  try {
    await page.waitForSelector('.auth-container, .auth-card, h1', { timeout: 10000 });
  } catch {
    // If no auth elements found, the page might be on a different screen
    // Just wait a bit more
    await page.waitForTimeout(2000);
  }
}

/**
 * Clears all storage including Firebase cache
 */
async function clearAllStorage(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Clear IndexedDB for Firebase auth
  await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
}

export interface AuthFixtures {
  testUser: TestUser;
  loggedInPage: Page;
}

export const test = base.extend<AuthFixtures>({
  testUser: TEST_USERS.primary,

  loggedInPage: async ({ page, testUser }, use) => {
    // Navigate to login
    await page.goto('/login');
    await waitForAppReady(page);

    // Fill login form
    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="password"]', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to groups
    await page.waitForURL('/', { timeout: 10000 });

    // Use the page for tests
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Creates a new test user with unique email
 */
export async function createTestUser(page: Page, overrides?: Partial<TestUser>): Promise<TestUser> {
  const user: TestUser = {
    ...TEST_USERS.primary,
    email: overrides?.email ?? `test${Date.now()}@example.com`,
    displayName: overrides?.displayName ?? `Test User ${Date.now()}`,
    ...overrides,
  };

  await page.goto('/signup');
  await waitForAppReady(page);
  
  await page.fill('input[id="displayName"]', user.displayName);
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.fill('input[id="confirmPassword"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to groups
  await page.waitForURL('/', { timeout: 10000 });

  return user;
}

/**
 * Logs in with existing test user
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await waitForAppReady(page);
  
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  await clearAllStorage(page);
}

/**
 * Prepares a fresh page for testing (call in beforeEach)
 */
export async function preparePageForTest(page: Page): Promise<void> {
  await clearAllStorage(page);
  await waitForAppReady(page);
}