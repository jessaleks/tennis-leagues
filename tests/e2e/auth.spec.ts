import { test, expect } from '@playwright/test';

// E2E tests require valid Firebase configuration.
// These tests are skipped because the app crashes on Firebase initialization
// when VITE_FIREBASE_* environment variables are not set.
//
// To enable E2E tests:
// 1. Add valid Firebase config to .env file (or .env.test)
// 2. Or implement error handling in firebase.ts to gracefully handle missing config
// 3. Or use MSW with proper Firebase API mocking at the SDK level

test.describe('Auth Flow', () => {
  test('should signup with email/password and redirect to groups', async ({ page }) => {
    test.skip();
  });

  test('should login with email/password and redirect to groups', async ({ page }) => {
    test.skip();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    test.skip();
  });

  test('should show validation errors on invalid signup', async ({ page }) => {
    test.skip();
  });

  test('should navigate from login to signup', async ({ page }) => {
    test.skip();
  });

  test('should navigate from signup to login', async ({ page }) => {
    test.skip();
  });
});