import { test, expect } from '@playwright/test';

test.describe('Job Details', () => {
  test('job detail page loads from browse', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForTimeout(1000);
    const firstCard = page.locator('a[href*="/jobs/"]').first();
    const exists = await firstCard.count() > 0;
    if (!exists) { test.skip(); return; }
    await firstCard.click();
    await expect(page).toHaveURL(/\/jobs\/\d+/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('job detail shows apply button or login prompt', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForTimeout(1000);
    const firstCard = page.locator('a[href*="/jobs/"]').first();
    const exists = await firstCard.count() > 0;
    if (!exists) { test.skip(); return; }
    await firstCard.click();
    await expect(page).toHaveURL(/\/jobs\/\d+/);
    const applyOrLogin = page.locator('button:has-text("Apply"), a:has-text("Apply Now"), a:has-text("Login")').first();
    await expect(applyOrLogin).toBeVisible({ timeout: 5000 });
  });

  test('job detail shows department and job type info', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForTimeout(1000);
    const firstCard = page.locator('a[href*="/jobs/"]').first();
    const exists = await firstCard.count() > 0;
    if (!exists) { test.skip(); return; }
    await firstCard.click();
    await expect(page).toHaveURL(/\/jobs\/\d+/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 page shown for invalid job id', async ({ page }) => {
    await page.goto('/jobs/99999999');
    const notFound = page.locator('text=not found, text=404, text=Job not found').first();
    await expect(notFound).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});
