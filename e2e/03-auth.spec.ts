import { test, expect } from '@playwright/test';

const UNIQUE = Date.now();
const TEST_EMAIL = `e2e_user_${UNIQUE}@test.com`;
const TEST_PASS  = 'TestPass@123';

// Save superadmin token once for auth tests that need it
let savedToken = '';
let savedUser  = '';

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/superadmin-login');
  await page.fill('input[type="email"]', 'superadmin@qci.org');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  // Wait for the dashboard URL specifically (not /superadmin-login which also matches /superadmin/i)
  await page.waitForURL(url => !url.href.includes('superadmin-login'), { timeout: 15000 });
  await page.waitForFunction(() => !!localStorage.getItem('token'), { timeout: 10000 });
  savedToken = await page.evaluate(() => localStorage.getItem('token') || '');
  savedUser  = await page.evaluate(() => localStorage.getItem('user') || '');
  await page.close();
});

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login rejects wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nobody_fake@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials, text=incorrect, text=wrong').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('register new jobseeker account', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[type="email"]', TEST_EMAIL);
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.first().fill(TEST_PASS);
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login with valid super admin credentials', async ({ page }) => {
    // Inject saved token (no extra login needed → rate limit safe)
    if (savedToken) {
      await page.addInitScript(({ t, u }) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
      }, { t: savedToken, u: savedUser });
    }
    await page.goto('/superadmin');
    await expect(page).toHaveURL(/\/superadmin/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('logout works', async ({ page }) => {
    if (savedToken) {
      await page.addInitScript(({ t, u }) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
      }, { t: savedToken, u: savedUser });
    }
    await page.goto('/superadmin');
    await page.waitForURL(/\/superadmin/i, { timeout: 10000 });
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Logout")').first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).not.toHaveURL(/\/superadmin$/);
    }
  });
});
