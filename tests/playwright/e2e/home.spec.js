const { test, expect } = require('@playwright/test');

test.describe('首頁', () => {
  test('可載入應用程式核心容器', async ({ page }) => {
    await page.goto('/index.html');

    await expect(page).toHaveTitle(/AI.*高中.*學習.*系統/);
    await expect(page.locator('#app')).toBeVisible();
  });
});
