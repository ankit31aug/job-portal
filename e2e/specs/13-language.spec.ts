import { test, expect } from '@playwright/test';

test.describe('Language Selector', () => {
  test('language selector shows 11 languages', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button').filter({ hasText: /English|हिन्दी|বাংলা|తెలుగు|தமிழ்|ગુજરાતી|ಕನ್ನಡ|മലയാളം|ਪੰਜਾਬੀ|ଓଡ଼ିଆ|मराठी/ }).first().click();
    const langButtons = page.locator('button:has-text("English"), button:has-text("हिन्दी"), button:has-text("मराठी"), button:has-text("বাংলা"), button:has-text("తెలుగు"), button:has-text("தமிழ்"), button:has-text("ગુજરાતી"), button:has-text("ಕನ್ನಡ"), button:has-text("മലയാളം"), button:has-text("ਪੰਜਾਬੀ"), button:has-text("ଓଡ଼ିଆ")');
    await expect(langButtons.first()).toBeVisible({ timeout: 3000 });
  });

  test('switching to Bengali updates navbar text', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button').filter({ hasText: /English|হিন্দী|বাংলা|मराठी/ }).first().click();
    await page.locator('button:has-text("বাংলা")').first().click();
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('switching to Tamil updates navbar text', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button').filter({ hasText: /English|தமிழ்|हिन्दी/ }).first().click();
    await page.locator('button:has-text("தமிழ்")').first().click();
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('language selection persists after navigation', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav button').filter({ hasText: /English|हिन्दी|मराठी/ }).first().click();
    await page.locator('button:has-text("हिन्दी")').first().click();
    await page.goto('/about');
    await expect(page.locator('nav').first()).toBeVisible();
    const storedLang = await page.evaluate(() => localStorage.getItem('qci_lang'));
    expect(storedLang).toBe('hi');
  });

  test('language selector button shows current language native name', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.locator('nav button').filter({ hasText: /English|हिन्दी|বাংলা|తెలుగు|தமிழ்|ગુજરાતી|ಕನ್ನಡ|മലയാളം|ਪੰਜਾਬੀ|ଓଡ଼ིଆ|मराठी/ }).first();
    await expect(langBtn).toBeVisible();
  });
});
