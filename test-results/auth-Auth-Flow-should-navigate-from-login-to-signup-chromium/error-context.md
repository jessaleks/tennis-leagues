# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth Flow >> should navigate from login to signup
- Location: tests/e2e/auth.spec.ts:33:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href="/signup"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Auth Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Clear local storage and wait for app to initialize
  6  |     await page.goto('/login');
  7  |     await page.evaluate(() => localStorage.clear());
  8  |     await page.reload();
  9  |     // Wait for Firebase to initialize
  10 |     await page.waitForLoadState('networkidle');
  11 |   });
  12 | 
  13 |   test('should signup with email/password and redirect to groups', async ({ page }) => {
  14 |     // Skipped: Firebase auth needs proper mocking
  15 |     test.skip();
  16 |   });
  17 | 
  18 |   test('should login with email/password and redirect to groups', async ({ page }) => {
  19 |     // Skipped: Firebase auth needs proper mocking
  20 |     test.skip();
  21 |   });
  22 | 
  23 |   test('should redirect to login when accessing protected route', async ({ page }) => {
  24 |     // Skipped: AuthGuard needs to properly handle redirect
  25 |     test.skip();
  26 |   });
  27 | 
  28 |   test('should show validation errors on invalid signup', async ({ page }) => {
  29 |     // Skipped: Firebase auth needs proper mocking
  30 |     test.skip();
  31 |   });
  32 | 
  33 |   test('should navigate from login to signup', async ({ page }) => {
  34 |     await page.goto('/login');
  35 |     await page.waitForLoadState('networkidle');
  36 | 
  37 |     // Click signup link
> 38 |     await page.click('a[href="/signup"]');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  39 | 
  40 |     // Should be on signup page
  41 |     await expect(page).toHaveURL('/signup');
  42 |   });
  43 | 
  44 |   test('should navigate from signup to login', async ({ page }) => {
  45 |     await page.goto('/signup');
  46 |     await page.waitForLoadState('networkidle');
  47 | 
  48 |     // Click login link
  49 |     await page.click('a[href="/login"]');
  50 | 
  51 |     // Should be on login page
  52 |     await expect(page).toHaveURL('/login');
  53 |   });
  54 | });
  55 | 
```