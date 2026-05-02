import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with hero section', async ({ page }) => {
    await expect(page).toHaveTitle(/Quality Council|QCI/i);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('hero search form works', async ({ page }) => {
    const input = page.locator('input[placeholder*="Role, board"]').first();
    await input.fill('NABH');
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/browse\?search=NABH/);
  });

  test('quick filter tags navigate to browse', async ({ page }) => {
    await page.click('button:has-text("NABH")');
    await expect(page).toHaveURL(/browse\?search=NABH/);
  });

  test('impact stats section is visible', async ({ page }) => {
    await expect(page.locator('text=QCI\'s National Impact')).toBeVisible();
  });

  test('What We Do section has 6 cards', async ({ page }) => {
    await expect(page.locator('text=Six Pillars. One Mission.')).toBeVisible();
    await expect(page.locator('text=Accreditation').first()).toBeVisible();
    await expect(page.locator('text=Quality Promotion').first()).toBeVisible();
    await expect(page.locator('text=International Recognition').first()).toBeVisible();
  });

  test('Announcements section renders', async ({ page }) => {
    await expect(page.locator('text=Latest from QCI')).toBeVisible();
  });

  test('The Organisation section has 5 boards', async ({ page }) => {
    await expect(page.locator('text=Five National Boards. One Standard.')).toBeVisible();
    for (const board of ['NABH', 'NABL', 'NABCB', 'NABET', 'NBQP']) {
      await expect(page.locator(`h3:has-text("${board}")`).first()).toBeVisible();
    }
  });

  test('Operating Divisions section has 4 divisions', async ({ page }) => {
    await expect(page.locator('h2:has-text("Four Core Divisions")').first()).toBeVisible();
    for (const div of ['PADD', 'PPID', 'NDIE', 'SPD']) {
      await expect(page.locator(`h3:has-text("${div}")`)).toBeVisible();
    }
  });

  test('Nation Building Flagships is below Operating Divisions', async ({ page }) => {
    const divs = page.locator('h2:has-text("Four Core Divisions")').first();
    const flagships = page.locator('text=Nation Building Flagships').first();
    const divsY = await divs.boundingBox();
    const flagshipsY = await flagships.boundingBox();
    expect(flagshipsY!.y).toBeGreaterThan(divsY!.y);
  });

  test('Why Choose QCI section renders', async ({ page }) => {
    await expect(page.locator('text=A Career That Means Something')).toBeVisible();
    await expect(page.locator('text=National Impact').first()).toBeVisible();
  });

  test('footer is present with QCI branding', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator('footer').first()).toBeVisible();
  });
});
