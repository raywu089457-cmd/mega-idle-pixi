import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH } from '../../PixiApp';
import { RESOURCES } from '../../data/gameData';
import { ResourceSystem_get, ResourceSystem_getCapacity, ResourceSystem_getFillPercent } from '../../systems/ResourceSystem';

// ═══════════════════════════════════════════════════════════════
// RESOURCE PANEL
// ═══════════════════════════════════════════════════════════════

const PANEL_HEADER_H = 50;
const PANEL_RES_IDS = ['gold', 'magicStones', 'fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];

export class ResourcePanel extends Container {
  private bg!: Graphics;
  private header!: Graphics;
  private resCards: Map<string, { bar: Graphics; fill: Graphics; valText: Text; capText: Text }> = new Map();

  constructor() {
    super();
    this.visible = false;
    this.build();
  }

  private build(): void {
    // Panel background
    this.bg = new Graphics();
    this.bg.rect(0, 0, GAME_WIDTH, 400);
    this.bg.fill({ color: 0xfaf0e6 });
    this.bg.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(this.bg);

    // Header bar
    this.header = new Graphics();
    this.header.rect(0, 0, GAME_WIDTH, PANEL_HEADER_H);
    this.header.fill({ color: 0x5d4037 });
    this.header.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(this.header);

    const titleStyle = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 8,
      fill: '#f4d03f',
    });
    const title = new Text({ text: '📦 資源', style: titleStyle });
    title.x = 12;
    title.y = 18;
    this.addChild(title);

    // Resource cards
    let y = PANEL_HEADER_H + 8;
    const cardH = 44;
    const cardGap = 8;

    for (const rid of PANEL_RES_IDS) {
      const card = this.buildResCard(rid, y, GAME_WIDTH - 24, cardH);
      this.addChild(card.container);
      y += cardH + cardGap;
    }
  }

  private buildResCard(resourceId: string, y: number, width: number, height: number) {
    const container = new Container();
    container.x = 12;
    container.y = y;

    const cfg = RESOURCES[resourceId];
    if (!cfg) return { container, bar: new Graphics(), fill: new Graphics(), valText: new Text({ text: '' }), capText: new Text({ text: '' }) };

    // Card background
    const cardBg = new Graphics();
    cardBg.roundRect(0, 0, width, height, 4);
    cardBg.fill({ color: 0xfaf0e6, alpha: 0.8 });
    cardBg.stroke({ color: 0x8b5a2b, width: 1 });
    container.addChild(cardBg);

    // Icon
    const icon = new Text({ text: cfg.icon, style: { fontSize: 24 } });
    icon.x = 8;
    icon.y = (height - 24) / 2;
    container.addChild(icon);

    // Name
    const nameStyle = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 6,
      fill: 0x8b7355,
    });
    const name = new Text({ text: cfg.name, style: nameStyle });
    name.x = 40;
    name.y = 4;
    container.addChild(name);

    // Value text
    const valStyle = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 10,
      fill: 0x5d4037,
    });
    const valText = new Text({ text: '0', style: valStyle });
    valText.x = 40;
    valText.y = 18;
    container.addChild(valText);
    this.resCards.set(resourceId, { bar: cardBg, fill: new Graphics(), valText, capText: valText });

    // Capacity text
    const capStyle = new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 8,
      fill: 0x8b7355,
    });
    const capText = new Text({ text: `/${cfg.capacity}`, style: capStyle });
    capText.x = 100;
    capText.y = 20;
    container.addChild(capText);
    this.resCards.get(resourceId)!.capText = capText;

    // Progress bar background
    const bar = new Graphics();
    bar.roundRect(40, 32, width - 56, 6, 2);
    bar.fill({ color: 0xd2b48c, alpha: 0.4 });
    container.addChild(bar);

    // Progress bar fill
    const fill = new Graphics();
    container.addChild(fill);
    this.resCards.get(resourceId)!.fill = fill;

    return { container, bar, fill, valText, capText };
  }

  update(): void {
    if (!this.visible) return;

    for (const rid of PANEL_RES_IDS) {
      const card = this.resCards.get(rid);
      if (!card) continue;

      const val = Math.floor(ResourceSystem_get(rid));
      const cap = ResourceSystem_getCapacity(rid);
      const fillPct = ResourceSystem_getFillPercent(rid);

      card.valText.text = val.toLocaleString();
      card.capText.text = `/${cap}`;

      // Redraw fill bar
      card.fill.clear();
      const barWidth = GAME_WIDTH - 24 - 56 - 8;
      const actualWidth = Math.min(barWidth, (fillPct / 100) * barWidth);
      const barColor = fillPct >= 90 ? 0xe74c3c : fillPct >= 80 ? 0xd2691e : 0x5d4037;
      card.fill.roundRect(40, 32, actualWidth, 6, 2);
      card.fill.fill({ color: barColor });
    }
  }
}