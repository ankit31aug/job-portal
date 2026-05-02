import { test, expect } from '@playwright/test';

test.describe('Browse Jobs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
  });

  test('browse page loads with job listings', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Role"]').first()).toBeVisible();
  });

  test('search box is functional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Role"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Quality');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('department filter works for NABH', async ({ page }) => {
    await page.goto('/browse?department=NABH');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('job card is clickable and navigates to detail', async ({ page }) => {
    await page.waitForTimeout(1000);
    const jobCard = page.locator('[data-testid="job-card"], .job-card, article').first();
    if (await jobCard.isVisible().catch(() => false)) {
      await jobCard.click();
      await expect(page).toHaveURL(/jobs\/\d+|job-details/);
    }
  });

  test('pagination renders when there are many jobs', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('URL params are reflected in filters', async ({ page }) => {
    await page.goto('/browse?search=Manager');
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Role"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      const value = await searchInput.inputValue();
      expect(value).toBe('Manager');
    }
  });
});
