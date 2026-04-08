# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation Flow >> should navigate from signup to login
- Location: tests/e2e/navigation.spec.ts:27:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href="/login"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Navigation Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |     await page.waitForLoadState('networkidle');
  9  |   });
  10 | 
  11 |   test('should redirect to login when accessing protected route', async ({ page }) => {
  12 |     // Skipped: AuthGuard needs to properly handle redirect
  13 |     test.skip();
  14 |   });
  15 | 
  16 |   test('should navigate from login to signup', async ({ page }) => {
  17 |     await page.goto('/login');
  18 |     await page.waitForLoadState('networkidle');
  19 | 
  20 |     // Click signup link
  21 |     await page.click('a[href="/signup"]');
  22 | 
  23 |     // Should be on signup page
  24 |     await expect(page).toHaveURL('/signup');
  25 |   });
  26 | 
  27 |   test('should navigate from signup to login', async ({ page }) => {
  28 |     await page.goto('/signup');
  29 |     await page.waitForLoadState('networkidle');
  30 | 
  31 |     // Click login link
> 32 |     await page.click('a[href="/login"]');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  33 | 
  34 |     // Should be on login page
  35 |     await expect(page).toHaveURL('/login');
  36 |   });
  37 | 
  38 |   test('should use back button', async ({ page }) => {
  39 |     test.skip(); // Requires authentication
  40 |   });
  41 | 
  42 |   test('should handle deep link to group', async ({ page }) => {
  43 |     test.skip(); // Requires authentication
  44 |   });
  45 | 
  46 |   test('should redirect unauthenticated user to login', async ({ page }) => {
  47 |     // Skipped: AuthGuard needs to properly handle redirect
  48 |     test.skip();
  49 |   });
  50 | });
  51 | 
```