import { test as setup } from '@playwright/test';
import { SUPERADMIN_FILE } from './test-utils';

setup('authenticate as superadmin', async ({ page }) => {
  await page.goto('/superadmin-login');
  await page.fill('input[type="email"]', 'superadmin@qci.org');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('superadmin-login'), { timeout: 15000 });
  await page.waitForFunction(() => !!localStorage.getItem('token'), { timeout: 10000 });
  await page.context().storageState({ path: SUPERADMIN_FILE });
});
