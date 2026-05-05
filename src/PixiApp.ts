import { Application } from 'pixi.js';

// ═══════════════════════════════════════════════════════════════
// PIXI APPLICATION FACTORY
// ═══════════════════════════════════════════════════════════════

const GAME_WIDTH = 480;
const BG_COLOR = 0xd2b48c; // 原遊戲配色

export interface GameDimensions {
  width: number;
  height: number;
  scale: number;
}

export async function createPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  const app = new Application();

  await app.init({
    canvas,
    width: GAME_WIDTH,
    height: window.innerHeight,
    backgroundColor: BG_COLOR,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  return app;
}

export { GAME_WIDTH, BG_COLOR };