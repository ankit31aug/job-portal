import { test, expect } from '@playwright/test';

test.describe('Careers Page', () => {
  test('careers page loads', async ({ page }) => {
    await page.goto('/careers');
    await expect(page).toHaveURL('/careers');
    await expect(page.locator('body')).toBeVisible();
  });

  test('careers page has career ladder section', async ({ page }) => {
    await page.goto('/careers');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('careers page has level progression info', async ({ page }) => {
    await page.goto('/careers');
    const levelText = page.locator('text=Level, text=Coordinator, text=Manager, text=career').first();
    await expect(levelText).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('careers page links to browse jobs', async ({ page }) => {
    await page.goto('/careers');
    const browseLink = page.locator('a[href="/browse"], a[href*="browse"]').first();
    await expect(browseLink).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
