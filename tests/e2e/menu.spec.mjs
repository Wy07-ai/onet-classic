import { test, expect } from '@playwright/test';

test.describe('Game bootstrap', () => {
  test('canvas mounts without console errors', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(String(err));
    });

    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    expect(
      consoleErrors,
      `Unexpected console errors during load:\n${consoleErrors.join('\n')}`
    ).toEqual([]);
  });
});
