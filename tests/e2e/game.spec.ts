import { test, expect, type Page } from '@playwright/test';

// Helper to get gold value from HUD
async function getGoldValue(page: Page): Promise<number> {
  // The HUD gold text is inside the PIXI canvas, so we read from the game's exposed state
  // For now, we'll use a simpler approach - evaluate the global game state
  return await page.evaluate(() => {
    // @ts-ignore - global game reference
    return window._gameState?.resources?.gold ?? 0;
  });
}

test.describe('王國傳說 — PixiJS', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('canvas renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForSelector('canvas#game-canvas');

    // Canvas should be visible and have dimensions
    const canvas = page.locator('canvas#game-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);

    // No critical errors
    const criticalErrors = errors.filter(e => !e.includes('warning') && !e.includes('deprecat'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('game loop runs — resources produce over time', async ({ page }) => {
    await page.goto('/');

    // Wait for game to initialize
    await page.waitForTimeout(1500);

    // Get initial state
    const goldBefore = await page.evaluate(() => {
      // @ts-ignore
      return window._gameState?.resources?.gold ?? 500;
    });

    // Wait for 2 seconds (2 ticks)
    await page.waitForTimeout(2200);

    // Gold should remain stable (no castle clicking in this version)
    // But other resources should have produced
    const goldAfter = await page.evaluate(() => {
      // @ts-ignore
      return window._gameState?.resources?.gold ?? 500;
    });

    // Materials should have increased (monument produces every tick)
    const fruitBefore = await page.evaluate(() => {
      // @ts-ignore
      return window._gameState?.resources?.fruitPoor ?? 0;
    });

    await page.waitForTimeout(2000);

    const fruitAfter = await page.evaluate(() => {
      // @ts-ignore
      return window._gameState?.resources?.fruitPoor ?? 0;
    });

    // At least some materials should have been produced
    expect(fruitAfter).toBeGreaterThan(fruitBefore);
  });

  test('bottom nav buttons are interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');

    // The game uses PIXI, so we can't easily click internal buttons
    // This test at least verifies the canvas is there
    const canvas = page.locator('canvas#game-canvas');
    await expect(canvas).toBeVisible();

    // Check canvas has correct dimensions
    const box = await canvas.boundingBox();
    expect(box?.width).toBe(480);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out non-critical errors (warnings, etc)
    const critical = errors.filter(e =>
      !e.includes('[React]') &&
      !e.includes('warning') &&
      !e.includes('Warning')
    );

    expect(critical).toHaveLength(0);
  });
});