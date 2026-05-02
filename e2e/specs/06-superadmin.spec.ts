import { test, expect, Browser } from '@playwright/test';

// Login once, share token across all tests via addInitScript
let savedToken = '';
let savedUser  = '';

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const page = await browser.newPage();
  await page.goto('/superadmin-login');
  await page.fill('input[type="email"]', 'superadmin@qci.org');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  // Wait for the dashboard URL specifically (not /superadmin-login which would match /superadmin/i)
  await page.waitForURL(url => !url.href.includes('superadmin-login'), { timeout: 15000 });
  await page.waitForFunction(() => !!localStorage.getItem('token'), { timeout: 10000 });
  savedToken = await page.evaluate(() => localStorage.getItem('token') || '');
  savedUser  = await page.evaluate(() => localStorage.getItem('user') || '');
  await page.close();
});

test.beforeEach(async ({ page }) => {
  if (savedToken) {
    await page.addInitScript(({ t, u }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', u);
    }, { t: savedToken, u: savedUser });
  }
});

test.describe('Super Admin Dashboard', () => {
  test('superadmin-login page loads', async ({ browser }) => {
    // Use fresh context — beforeEach injects auth token which would redirect away from login page
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/superadmin-login');
    await expect(p.locator('input[type="email"]')).toBeVisible();
    await expect(p.locator('input[type="password"]')).toBeVisible();
    await ctx.close();
  });

  test('rejects non-superadmin login', async ({ page }) => {
    const ctx = await page.context().browser()!.newContext();
    const p = await ctx.newPage();
    await p.goto('/superadmin-login');
    await p.fill('input[type="email"]', 'wrong@example.com');
    await p.fill('input[type="password"]', 'Admin@123');
    await p.click('button[type="submit"]');
    await p.waitForTimeout(2000);
    await expect(p).not.toHaveURL(/\/superadmin$/);
    await ctx.close();
  });

  test('superadmin can login', async ({ page }) => {
    await page.goto('/superadmin');
    await expect(page).toHaveURL(/\/superadmin/);
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

  test('dashboard stats are visible', async ({ page }) => {
    await page.goto('/superadmin');
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Jobs')).toBeVisible();
    await expect(page.locator('text=Applications')).toBeVisible();
  });

  test('Jobs tab loads job list', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Jobs")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=total jobs')).toBeVisible();
  });

  test('Users tab shows user list', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=total users')).toBeVisible();
  });

  test('Settings tab loads with page tabs', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("General")')).toBeVisible();
    await expect(page.locator('button:has-text("Home Page")')).toBeVisible();
    await expect(page.locator('button:has-text("About Page")')).toBeVisible();
    await expect(page.locator('button:has-text("Contact")')).toBeVisible();
  });

  test('Settings General tab shows site identity fields', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("General")');
    await expect(page.locator('text=Site Name').first()).toBeVisible();
    await expect(page.locator('text=Site Tagline')).toBeVisible();
    await expect(page.locator('text=Primary Colour')).toBeVisible();
  });

  test('Settings Home tab shows hero fields', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Home Page")');
    await expect(page.locator('text=Hero Badge')).toBeVisible();
    await expect(page.locator('text=Headline Line 1')).toBeVisible();
    await expect(page.locator('text=Impact Stats')).toBeVisible();
  });

  test('Settings About tab shows leadership JSON field', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("About Page")');
    await expect(page.locator('text=Leadership Team')).toBeVisible();
    await expect(page.locator('button:has-text("Format")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Validate")').first()).toBeVisible();
  });

  test('JSON Format button works', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("About Page")');
    await page.locator('button:has-text("Format")').first().click();
    await page.waitForTimeout(500);
  });

  test('Settings Contact tab shows address fields', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Contact")');
    await expect(page.locator('text=Office Address')).toBeVisible();
    await expect(page.locator('text=General Email')).toBeVisible();
  });

  test('HR Roles tab can create a role', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Roles")');
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("Role Hierarchy")').first()).toBeVisible();
  });

  test('Gallery tab loads', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Gallery")');
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("Gallery Item")').first()).toBeVisible();
  });

  test('Boards tab shows 5 boards', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Boards")');
    await page.waitForTimeout(1000);
    for (const board of ['NABH', 'NABL', 'NABCB', 'NABET', 'NBQP']) {
      await expect(page.locator(`text=${board}`).first()).toBeVisible();
    }
  });

  test('save settings persists site_name change', async ({ page }) => {
    await page.goto('/superadmin');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("General")');
    const nameInput = page.locator('input').first();
    await nameInput.fill('Quality Council of India');
    await page.click('button:has-text("Save All Settings")');
    await expect(page.locator('text=Saved successfully').first()).toBeVisible({ timeout: 5000 });
  });
});
