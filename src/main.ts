import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createPixiApp, GAME_WIDTH } from './PixiApp';
import { ResourceSystem_init, ResourceSystem_produceMaterials, ResourceSystem_get } from './systems/ResourceSystem';
import { BuildingSystem_init, BuildingSystem_getLevel } from './systems/BuildingSystem';
import { HeroSystem_init, HeroSystem_addTerritoryHero, HeroSystem_processWanderingTick, HeroSystem_processRestingTick, HeroSystem_trainHero, HeroSystem_getRecruitCost, HeroSystem_sendToExplore, HeroSystem_processExplorationTick } from './systems/HeroSystem';
import { MapSystem_init, MapSystem_processExplorations } from './systems/MapSystem';
import { ShopSystem_init, ShopSystem_processAutoProduction } from './systems/ShopSystem';
import { SaveManager_save, SaveManager_load } from './systems/SaveManager';
import { OfflineSystem_init, OfflineSystem_markOffline, OfflineSystem_markOnline } from './systems/OfflineSystem';
import { ResourcePanel } from './rendering/panels/ResourcePanel';
import { HeroPanel } from './rendering/panels/HeroPanel';
import { BuildingPanel } from './rendering/panels/BuildingPanel';
import { MapPanel } from './rendering/panels/MapPanel';
import { ShopPanel } from './rendering/panels/ShopPanel';
import { createTerritoryHero } from './data/gameData';

// ═══════════════════════════════════════════════════════════════
// FLOAT NUMBER RENDERER
// ═══════════════════════════════════════════════════════════════

interface FloatNumber {
  text: Text;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  active: boolean;
}

class FloatNumberRenderer {
  private floats: FloatNumber[] = [];
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  spawn(text: string, x: number, y: number): void {
    const style = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 12,
      fill: '#5d4037',
      dropShadow: {
        color: '#000000',
        blur: 1,
        distance: 1,
        angle: Math.PI / 4,
      },
    });

    const pixiText = new Text({ text, style });
    pixiText.anchor.set(0.5);
    pixiText.x = x + (Math.random() - 0.5) * 60;
    pixiText.y = y;
    pixiText.alpha = 1;

    this.container.addChild(pixiText);
    this.floats.push({
      text: pixiText,
      x: pixiText.x,
      y,
      vy: -1.2 - Math.random() * 0.8,
      alpha: 1,
      active: true,
    });
  }

  update(dt: number): void {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.y += f.vy * dt * 60;
      f.alpha -= 0.016 * dt * 60;
      f.text.y = f.y;
      f.text.alpha = Math.max(0, f.alpha);

      if (f.alpha <= 0) {
        this.container.removeChild(f.text);
        f.text.destroy();
        this.floats.splice(i, 1);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CASTLE SCENE
// ═══════════════════════════════════════════════════════════════

class CastleScene extends Container {
  private castleText: Text;
  private floatOffset = 0;
  private floatDir = 1;
  private clickScale = 1;

  constructor() {
    super();

    const style = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 144,
    });

    this.castleText = new Text({ text: '🏰', style });
    this.castleText.anchor.set(0.5);
    this.castleText.x = GAME_WIDTH / 2;
    this.castleText.y = 200;
    this.castleText.eventMode = 'static';
    this.castleText.cursor = 'pointer';

    this.addChild(this.castleText);
  }

  update(dt: number): void {
    // Float animation (4s period)
    this.floatOffset += 0.016 * dt * (Math.PI * 2 / 4) * this.floatDir;
    if (Math.abs(this.floatOffset) > 8) this.floatDir *= -1;
    this.castleText.y = 200 + this.floatOffset;

    // Click scale animation
    if (this.clickScale !== 1) {
      this.clickScale += (1 - this.clickScale) * 0.2 * dt * 60;
      if (Math.abs(this.clickScale - 1) < 0.01) this.clickScale = 1;
      this.castleText.scale.set(this.clickScale);
    }
  }

  onClick(handler: () => void): void {
    this.castleText.on('pointerdown', () => {
      this.clickScale = 0.85;
      handler();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// HUD (Heads-Up Display)
// ═══════════════════════════════════════════════════════════════

class HUD extends Container {
  private goldText: Text;
  private magicText: Text;
  private matTexts: Record<string, Text> = {};
  private matIcons: Record<string, Text> = {};

  constructor() {
    super();

    // Background bar
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, 60);
    bg.fill({ color: 0x5d4037 });
    bg.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(bg);

    // Gold display
    const goldIcon = new Text({ text: '🪙', style: { fontSize: 20 } });
    goldIcon.x = 12;
    goldIcon.y = 12;
    this.addChild(goldIcon);

    this.goldText = new Text({
      text: '500',
      style: new TextStyle({
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10,
        fill: '#f4d03f',
      }),
    });
    this.goldText.x = 36;
    this.goldText.y = 16;
    this.addChild(this.goldText);

    // Magic stones
    const magicIcon = new Text({ text: '💎', style: { fontSize: 20 } });
    magicIcon.x = 100;
    magicIcon.y = 12;
    this.addChild(magicIcon);

    this.magicText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10,
        fill: '#f4d03f',
      }),
    });
    this.magicText.x = 124;
    this.magicText.y = 16;
    this.addChild(this.magicText);

    // Material icons (center)
    const matIds = ['🍎', '💧', '🪵', '⚙️', '🌿'];
    const matKeys = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];
    matKeys.forEach((key, i) => {
      const icon = new Text({ text: matIds[i], style: { fontSize: 18 } });
      icon.x = 200 + i * 50;
      icon.y = 10;
      this.addChild(icon);
      this.matIcons[key] = icon;

      const txt = new Text({
        text: '0',
        style: new TextStyle({
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          fill: '#f4d03f',
        }),
      });
      txt.x = 200 + i * 50;
      txt.y = 32;
      this.addChild(txt);
      this.matTexts[key] = txt;
    });
  }

  update(gold: number, magic: number, mats: Record<string, number>): void {
    this.goldText.text = Math.floor(gold).toLocaleString();
    this.magicText.text = Math.floor(magic).toLocaleString();

    const matKeys = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];
    for (const key of matKeys) {
      if (this.matTexts[key]) {
        const val = Math.floor(mats[key] || 0);
        this.matTexts[key].text = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString();
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════

export type PanelId = 'res' | 'hero' | 'build' | 'map' | 'shop' | null;

class BottomNav extends Container {
  private buttons: Map<PanelId, Graphics> = new Map();
  private activePanel: PanelId = null;
  public onNavigate: (panel: PanelId) => void = () => {};

  private readonly NAV_ITEMS: Array<{ id: PanelId; icon: string; label: string; x: number }> = [
    { id: 'res', icon: '📦', label: '資源', x: GAME_WIDTH * 0.1 },
    { id: 'hero', icon: '⚔️', label: '英雄', x: GAME_WIDTH * 0.3 },
    { id: 'build', icon: '🏗️', label: '建築', x: GAME_WIDTH * 0.5 },
    { id: 'map', icon: '🗺️', label: '地圖', x: GAME_WIDTH * 0.7 },
    { id: 'shop', icon: '🛒', label: '商店', x: GAME_WIDTH * 0.9 },
  ];

  constructor() {
    super();
    this.y = window.innerHeight - 56 - (window.innerHeight * 0.01);

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, 56);
    bg.fill({ color: 0x5d4037 });
    bg.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(bg);

    for (const item of this.NAV_ITEMS) {
      const btn = new Graphics();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.x = item.x;
      btn.y = 4;

      const icon = new Text({ text: item.icon, style: { fontSize: 30 } });
      icon.anchor.set(0.5);
      icon.x = 0;
      icon.y = 16;
      btn.addChild(icon);

      btn.on('pointerdown', () => {
        if (this.activePanel === item.id) {
          this.setActive(null);
        } else {
          this.setActive(item.id);
        }
        this.onNavigate(this.activePanel);
      });

      this.buttons.set(item.id, btn);
      this.addChild(btn);
    }
  }

  setActive(panel: PanelId): void {
    this.activePanel = panel;
    for (const [id, btn] of this.buttons) {
      btn.alpha = id === panel ? 1 : 0.5;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN GAME
// ═══════════════════════════════════════════════════════════════

let app: Application;
let floatRenderer: FloatNumberRenderer;
let castleScene: CastleScene;
let hud: HUD;
let bottomNav: BottomNav;
let resourcePanel: ResourcePanel;
let heroPanel: HeroPanel;
let buildingPanel: BuildingPanel;
let mapPanel: MapPanel;
let shopPanel: ShopPanel;
let activePanel: Container | null = null;

async function init() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas not found');

  app = await createPixiApp(canvas);

  // Load saved state
  const savedState = SaveManager_load();

  // Initialize systems with saved state
  OfflineSystem_init(savedState ?? undefined);
  ResourceSystem_init();
  BuildingSystem_init(savedState ?? undefined);
  MapSystem_init(savedState ?? undefined);
  ShopSystem_init(savedState ?? undefined);
  HeroSystem_init(savedState ?? undefined);

  // Add starter hero if no save
  if (!savedState) {
    const starter = createTerritoryHero('warrior', 'Sir Aldric', 1);
    if (starter) HeroSystem_addTerritoryHero(starter);
  }

  // Panels (created but hidden initially)
  resourcePanel = new ResourcePanel();
  resourcePanel.visible = false;
  app.stage.addChild(resourcePanel);

  heroPanel = new HeroPanel();
  heroPanel.visible = false;
  app.stage.addChild(heroPanel);

  buildingPanel = new BuildingPanel();
  buildingPanel.visible = false;
  app.stage.addChild(buildingPanel);

  mapPanel = new MapPanel();
  mapPanel.visible = false;
  app.stage.addChild(mapPanel);

  shopPanel = new ShopPanel();
  shopPanel.visible = false;
  app.stage.addChild(shopPanel);

  // HUD
  hud = new HUD();
  app.stage.addChild(hud);

  // Castle scene
  castleScene = new CastleScene();
  app.stage.addChild(castleScene);

  castleScene.onClick(() => {
    floatRenderer.spawn('+0', GAME_WIDTH / 2, 300);
  });

  // Float number renderer
  floatRenderer = new FloatNumberRenderer(app.stage);

  // Bottom nav
  bottomNav = new BottomNav();
  app.stage.addChild(bottomNav);

  // Panel navigation
  bottomNav.onNavigate = (panel) => {
    if (activePanel) activePanel.visible = false;
    activePanel = null;

    switch (panel) {
      case 'res':
        activePanel = resourcePanel;
        break;
      case 'hero':
        activePanel = heroPanel;
        break;
      case 'build':
        activePanel = buildingPanel;
        break;
      case 'map':
        activePanel = mapPanel;
        break;
      case 'shop':
        activePanel = shopPanel;
        break;
    }

    if (activePanel) {
      activePanel.visible = true;
      (activePanel as unknown as { update(): void }).update();
    }
  };

  // Track selected zone for hero dispatch
  let selectedZone = 1;

  // Map panel: update selected zone when user clicks a zone
  mapPanel.onZoneSelect = (zoneId: number) => {
    selectedZone = zoneId;
  };

  // Hero panel callbacks
  heroPanel.onTrain = (heroId: string) => {
    const cost = HeroSystem_getRecruitCost(heroId) * 1.5;
    HeroSystem_trainHero(heroId, { gold: Math.floor(cost) });
    heroPanel.update();
  };

  heroPanel.onDispatch = (heroId: string) => {
    HeroSystem_sendToExplore(heroId, selectedZone);
    heroPanel.update();
  };

  // Building panel callbacks
  buildingPanel.onUpgrade = () => {
    buildingPanel.update();
  };

  // Shop panel callbacks
  shopPanel.onCraft = () => {
    shopPanel.update();
  };

  // Game loop
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;

    castleScene.update(dt);
    floatRenderer.update(dt);

    hud.update(
      ResourceSystem_get('gold'),
      ResourceSystem_get('magicStones'),
      {
        fruitPoor: ResourceSystem_get('fruitPoor'),
        waterDirty: ResourceSystem_get('waterDirty'),
        woodRotten: ResourceSystem_get('woodRotten'),
        ironRusty: ResourceSystem_get('ironRusty'),
        herbLow: ResourceSystem_get('herbLow'),
      }
    );

    if (activePanel) (activePanel as unknown as { update(): void }).update();
  });

  // Game tick (1 second interval)
  let tickCount = 0;
  setInterval(() => {
    tickCount++;
    const mLv = BuildingSystem_getLevel('monument');
    ResourceSystem_produceMaterials(mLv);
    HeroSystem_processWanderingTick();
    HeroSystem_processRestingTick();
    for (let z = 1; z <= 5; z++) HeroSystem_processExplorationTick(z);
    MapSystem_processExplorations();
    ShopSystem_processAutoProduction();

    // Auto-save every 30 seconds
    if (tickCount % 30 === 0) {
      SaveManager_save();
    }

    // Spawn floating numbers for material production
    const mats = {
      fruitPoor: ResourceSystem_get('fruitPoor'),
      waterDirty: ResourceSystem_get('waterDirty'),
      woodRotten: ResourceSystem_get('woodRotten'),
      ironRusty: ResourceSystem_get('ironRusty'),
      herbLow: ResourceSystem_get('herbLow'),
    };
    Object.entries(mats).forEach(([key, val]) => {
      if (val > 0) {
        const matNames: Record<string, string> = {
          fruitPoor: '🍎', waterDirty: '💧', woodRotten: '🪵', ironRusty: '⚙️', herbLow: '🌿',
        };
        floatRenderer.spawn(`+${matNames[key] || key}`, 200 + Math.random() * 80, 200);
      }
    });
  }, 1000);

  // Offline progress on return
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      OfflineSystem_markOffline();
      SaveManager_save();
    } else {
      const summary = OfflineSystem_markOnline();
      if (summary && summary.cappedSeconds > 0) {
        console.log(`[Offline] Away ${summary.cappedSeconds}s — ` +
          `Gold: +${summary.heroExplorationGold}(explore) +${summary.heroWanderingGold}(wander) ` +
          `flat: ${summary.goldProduced - summary.heroExplorationGold - summary.heroWanderingGold}, ` +
          `Zones cleared: ${summary.zonesCleared}, Heroes healed: ${summary.heroesHealed}`);
      }
    }
  });

  console.log('[Game] PixiJS game initialized!');
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(console.error);
});