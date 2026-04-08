import { test as base, Page, Route } from '@playwright/test';

// Mock user storage
let mockUsers: Map<string, { email: string; password: string; displayName: string }> = new Map();
let mockSession: { user: { localId: string; email: string; displayName: string } | null } = { user: null };

function resetAuth() {
  mockUsers.clear();
  mockSession.user = null;
}

export { resetAuth };

// Helper to create mock Firebase user
function createMockUser(email: string, displayName: string) {
  return {
    localId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    displayName,
    idToken: `id_token_${Date.now()}`,
    refreshToken: `refresh_token_${Date.now()}`,
    expiresIn: '3600',
  };
}

// Firebase Auth API handlers
const authHandlers = [
  // Sign up
  async (route: Route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const { email, password, displayName } = body;

    if (!email || !password) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'Invalid email', errors: [{ message: 'Invalid email' }] },
        }),
      });
    }

    if (password.length < 6) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'Weak password', errors: [{ message: 'Password should be at least 6 characters' }] },
        }),
      });
    }

    if (mockUsers.has(email)) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'Email already in use', errors: [{ message: 'Email already in use' }] },
        }),
      });
    }

    const user = createMockUser(email, displayName || email.split('@')[0]);
    mockUsers.set(email, { email, password, displayName: user.displayName });
    mockSession.user = { localId: user.localId, email: user.email, displayName: user.displayName };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  },

  // Sign in
  async (route: Route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const { email, password } = body;

    const storedUser = mockUsers.get(email);
    if (!storedUser || storedUser.password !== password) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 400, message: 'Invalid credentials', errors: [{ message: 'Invalid email or password' }] },
        }),
      });
    }

    const user = createMockUser(email, storedUser.displayName);
    mockSession.user = { localId: user.localId, email: user.email, displayName: user.displayName };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  },

  // Lookup (get user info)
  async (route: Route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const { idToken } = body;

    if (!idToken || !mockSession.user) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [] }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ users: [mockSession.user] }),
    });
  },

  // Sign out
  async (route: Route) => {
    mockSession.user = null;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  },

  // Refresh token
  async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: `access_token_${Date.now()}`,
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: `refresh_token_${Date.now()}`,
      }),
    });
  },
];

export const test = base.extend({
  page: async ({ page }, use) => {
    // Reset state
    resetAuth();

    // Set up Firebase Auth mocking
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signUp', authHandlers[0]);
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', authHandlers[1]);
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup', authHandlers[2]);
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signOut', authHandlers[3]);
    await page.route('**/securetoken.googleapis.com/v1/token', authHandlers[4]);

    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Creates a new test user with unique email
 */
export async function createTestUser(page: Page): Promise<{ email: string; password: string; displayName: string }> {
  const email = `test${Date.now()}@example.com`;
  const password = 'TestPassword123';
  const displayName = 'Test User';

  await page.goto('/signup');
  await page.waitForLoadState('networkidle');

  await page.fill('input[id="displayName"]', displayName);
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="confirmPassword"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to groups
  await page.waitForURL('/', { timeout: 15000 });

  return { email, password, displayName };
}

/**
 * Logs in with existing test user
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
}