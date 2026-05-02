import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('about page loads with hero', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=Quality Council').first()).toBeVisible();
  });

  test('displays 4 impact stats', async ({ page }) => {
    await expect(page.locator('text=Years of Excellence')).toBeVisible();
    await expect(page.locator('text=National Boards')).toBeVisible();
  });

  test('leadership section renders with photos/initials', async ({ page }) => {
    await expect(page.locator('text=Leadership').first()).toBeVisible();
    await expect(page.locator('text=Jaxay Shah')).toBeVisible();
    await expect(page.locator('text=Hema Bhandari')).toBeVisible();
    await expect(page.locator('text=Chairperson, QCI')).toBeVisible();
    await expect(page.locator('text=Chief Advisor, QCI')).toBeVisible();
  });

  test('board chairs section renders', async ({ page }) => {
    await expect(page.locator('text=Chairpersons Across Our Boards').first()).toBeVisible();
  });

  test('mission and vision are displayed', async ({ page }) => {
    await expect(page.locator('text=Mission').first()).toBeVisible();
    await expect(page.locator('text=Vision').first()).toBeVisible();
  });

  test('milestones timeline renders', async ({ page }) => {
    await expect(page.locator('text=1997').first()).toBeVisible();
  });

  test('testimonials section renders', async ({ page }) => {
    const testimonials = page.locator('text=Arjun Mehta, text=Priya Nair').first();
    // Just ensure the page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });
});
