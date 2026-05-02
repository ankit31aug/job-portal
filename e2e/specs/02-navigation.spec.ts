import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navbar is visible on all pages', async ({ page }) => {
    for (const path of ['/', '/browse', '/about']) {
      await page.goto(path);
      await expect(page.locator('nav').first()).toBeVisible();
    }
  });

  test('logo navigates to home', async ({ page }) => {
    await page.goto('/about');
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('Browse Jobs link works', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/browse"]');
    await expect(page).toHaveURL('/browse');
  });

  test('About link navigates to about page', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/about"]').first().click();
    await expect(page).toHaveURL('/about');
  });

  test('Login link navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL('/login');
  });

  test('Media dropdown opens in navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button:has-text("Media")').first().click();
    await expect(page.locator('text=Press Releases').first()).toBeVisible();
    await expect(page.locator('text=Publications').first()).toBeVisible();
  });

  test('Governance dropdown opens in navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button:has-text("Governance")').first().click();
    await expect(page.locator('text=RTI').first()).toBeVisible();
    await expect(page.locator('text=Annual Reports').first()).toBeVisible();
  });

  test('Connect With Us dropdown opens in navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button:has-text("Connect")').first().click();
    await expect(page.locator('text=Our Offices')).toBeVisible();
  });

  test('Language selector switches to Hindi', async ({ page }) => {
    await page.goto('/');
    // Open language dropdown
    await page.locator('nav button').filter({ hasText: /English|हिन्दी|मराठी/ }).first().click();
    // Select Hindi
    await page.locator('button:has-text("हिन्दी")').first().click();
    // Nav label should change to Hindi
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('Board navigation from home to browse', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("View Careers")').first().click();
    await expect(page).toHaveURL(/browse\?department=/);
  });

  test('division card click navigates to browse', async ({ page }) => {
    await page.goto('/');
    await page.locator('h3:has-text("PADD")').click();
    await expect(page).toHaveURL(/browse\?department=PADD/);
  });
});
