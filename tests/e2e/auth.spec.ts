import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
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