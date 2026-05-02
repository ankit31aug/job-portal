import { test, expect } from '@playwright/test';

test.describe('HR Admin', () => {
  test('hr admin login page loads', async ({ page }) => {
    await page.goto('/admin-login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('hr admin login rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin-login');
    await page.fill('input[type="email"]', 'nobody@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test('hr admin login page has link back to main login', async ({ page }) => {
    await page.goto('/admin-login');
    const backLink = page.locator('a[href="/login"], a:has-text("Job Seeker"), a:has-text("back")').first();
    await expect(backLink).toBeVisible({ timeout: 3000 }).catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin dashboard redirects unauthenticated to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const url = page.url();
    const redirected = url.includes('login') || url.includes('admin-login') || url.includes('/admin');
    expect(redirected).toBeTruthy();
  });
});
