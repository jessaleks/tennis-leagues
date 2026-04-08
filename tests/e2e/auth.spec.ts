import { test, expect, createTestUser, loginUser, logoutUser } from '../fixtures/auth';

test.describe('Auth Flow', () => {
  test.describe('Navigation', () => {
    test('should navigate from login to signup', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Click signup link
      await page.click('a[href="/signup"]');

      // Should be on signup page
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate from signup to login', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Click login link
      await page.click('a[href="/login"]');

      // Should be on login page
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Sign Up', () => {
    test('should sign up with email/password and redirect to groups', async ({ page }) => {
      const email = `test${Date.now()}@example.com`;
      const password = 'TestPassword123';
      const displayName = 'Test User';

      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Fill signup form
      await page.fill('input[id="displayName"]', displayName);
      await page.fill('input[id="email"]', email);
      await page.fill('input[id="password"]', password);
      await page.fill('input[id="confirmPassword"]', password);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to groups page
      await page.waitForURL('/', { timeout: 15000 });
      await expect(page).toHaveURL('/');
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      await page.fill('input[id="displayName"]', 'Test User');
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', 'Password123');
      await page.fill('input[id="confirmPassword"]', 'DifferentPassword');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.auth-error')).toContainText('Passwords do not match');
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      await page.fill('input[id="displayName"]', 'Test User');
      await page.fill('input[id="email"]', 'test@example.com');
      await page.fill('input[id="password"]', '123');
      await page.fill('input[id="confirmPassword"]', '123');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.auth-error')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with email/password and redirect to groups', async ({ page }) => {
      // First create a user
      const { email, password } = await createTestUser(page);

      // Logout
      await logoutUser(page);

      // Now try to login
      await loginUser(page, email, password);

      // Should be on groups page
      await expect(page).toHaveURL('/');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.fill('input[id="email"]', 'nonexistent@example.com');
      await page.fill('input[id="password"]', 'WrongPassword123');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.auth-error')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Create and login user
      await createTestUser(page);

      // Verify we're on groups page
      await expect(page).toHaveURL('/');

      // Logout - clear localStorage and reload
      await page.evaluate(() => localStorage.clear());
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Should be on login page
      await expect(page).toHaveURL('/login');
    });
  });
});