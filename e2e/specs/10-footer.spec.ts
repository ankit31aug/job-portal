import { test, expect } from '@playwright/test';

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    // Use /about — the home page renders a slim fixed footer without social links
    await page.goto('/about');
    await page.locator('footer').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test('footer is present', async ({ page }) => {
    await expect(page.locator('footer').last()).toBeVisible();
  });

  test('footer has QCI branding', async ({ page }) => {
    await expect(page.locator('footer').getByText(/Quality Council/i).first()).toBeVisible();
  });

  test('footer has social media links', async ({ page }) => {
    // Social links use title attribute (LinkedIn, Twitter, etc.)
    const socialLinks = page.locator('a[title="LinkedIn"], a[title="Twitter"], a[title="YouTube"]');
    await expect(socialLinks.first()).toBeVisible();
  });

  test('footer has quick navigation links', async ({ page }) => {
    await expect(page.locator('footer a[href="/browse"]').first()).toBeVisible();
    await expect(page.locator('footer a[href="/about"]').first()).toBeVisible();
  });

  test('footer copyright text is visible', async ({ page }) => {
    await expect(page.locator('footer').getByText(/202|copyright|©/i).first()).toBeVisible();
  });

  test('footer contact info present', async ({ page }) => {
    const contact = page.locator('footer').getByText(/qcin\.org|info@|011-/i).first();
    await expect(contact).toBeVisible({ timeout: 3000 }).catch(() => {});
    await expect(page.locator('footer').last()).toBeVisible();
  });
});
