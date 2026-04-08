import { test as base, Page } from '@playwright/test';

// Track created users across requests (per-page context)
const createdUsers = new Map<string, { email: string; password: string; displayName: string }>();
let currentUser: { uid: string; email: string; displayName: string } | null = null;

function resetAuth() {
  createdUsers.clear();
  currentUser = null;
}

export { resetAuth };

export const test = base.extend({
  page: async ({ page }, use) => {
    resetAuth();

    // Intercept Firebase Auth API calls
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      const url = route.request().url();
      const body = JSON.parse(route.request().postData() || '{}');

      // Sign up
      if (url.includes('signUp')) {
        const { email, password } = body;

        if (!email || !password) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { message: 'Invalid email or password' },
            }),
          });
        }

        if (password.length < 6) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { message: 'Password should be at least 6 characters' },
            }),
          });
        }

        // Check if user already exists
        if (createdUsers.has(email)) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { message: 'EMAIL_EXISTS' },
            }),
          });
        }

        const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const displayName = body.displayName || email.split('@')[0];

        // Store created user
        createdUsers.set(email, { email, password, displayName });
        currentUser = { uid, email, displayName };

        // Return Firebase-compatible response
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idToken: `id_token_${uid}`,
            email,
            refreshToken: `refresh_${uid}`,
            expiresIn: '3600',
            localId: uid,
          }),
        });
      }

      // Update profile
      if (url.includes('update')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            localId: currentUser?.uid || 'user_' + Date.now(),
            email: currentUser?.email || body.email,
            displayName: body.displayName || currentUser?.displayName,
            photoUrl: body.photoUrl || '',
            passwordHash: '',
            providerUserInfo: [],
          }),
        });
      }

      // Sign in
      if (url.includes('signInWithPassword')) {
        const { email, password } = body;

        const storedUser = createdUsers.get(email);
        if (!storedUser || storedUser.password !== password) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { message: 'INVALID_PASSWORD' },
            }),
          });
        }

        const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        currentUser = { uid, email, displayName: storedUser.displayName };

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idToken: `id_token_${uid}`,
            email,
            refreshToken: `refresh_${uid}`,
            expiresIn: '3600',
            localId: uid,
            displayName: storedUser.displayName,
          }),
        });
      }

      // Lookup
      if (url.includes('lookup')) {
        if (!currentUser) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ users: [] }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [{
              localId: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              emailVerified: true,
              providerUserInfo: [{
                providerId: 'password',
                email: currentUser.email,
              }],
            }],
          }),
        });
      }

      // Sign out
      if (url.includes('signOut')) {
        currentUser = null;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }

      // Token refresh
      if (url.includes('token')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: `access_${Date.now()}`,
            expires_in: '3600',
            token_type: 'Bearer',
            refresh_token: `refresh_${Date.now()}`,
          }),
        });
      }

      return route.continue();
    });

    // Intercept Firestore calls
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      if (route.request().url().includes('Listen') || route.request().url().includes('Write')) {
        return route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: '',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('**/google.firestore.v1.Firestore/**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to set mock auth user in browser context
 */
async function setMockAuthUser(page: Page, user: { uid: string; email: string; displayName: string } | null) {
  await page.evaluate((u) => {
    if (u && (window as any).__setTestAuthUser) {
      (window as any).__setTestAuthUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        emailVerified: true,
        providerData: [{ providerId: 'password', email: u.email }],
        metadata: {},
        isAnonymous: false,
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
      });
    } else if (!u && (window as any).__clearTestAuthUser) {
      (window as any).__clearTestAuthUser();
    }
  }, user);
}

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

  // Wait a moment for Firebase calls to complete
  await page.waitForTimeout(500);

  // Set mock auth user
  await setMockAuthUser(page, { uid: 'test_' + Date.now(), email, displayName });

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

  // Wait a moment for Firebase calls to complete
  await page.waitForTimeout(500);

  // Set mock auth user
  await setMockAuthUser(page, { uid: 'test_' + Date.now(), email, displayName: email.split('@')[0] });

  // Wait for redirect to groups
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Logs out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  await setMockAuthUser(page, null);
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}