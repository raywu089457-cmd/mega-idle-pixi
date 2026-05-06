import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH } from '../../PixiApp';
import { ZONES } from '../../data/gameData';
import { MapSystem_getZones, MapSystem_getProgress, MapSystem_isZoneUnlocked, MapSystem_isZoneCleared } from '../../systems/MapSystem';

export class MapPanel extends Container {
  public onZoneSelect: (zoneId: number) => void = () => {};
  private selectedZoneId: number = 1;

  constructor() {
    super();
    this.visible = false;
    this.build();
  }

  private textStyle(size: number, color: number | string = 0x5d4037): TextStyle {
    return new TextStyle({
      fontFamily: "'Press Start 2P', monospace",
      fontSize: size,
      fill: color,
    });
  }

  private build(): void {
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, 400);
    bg.fill({ color: 0xfaf0e6 });
    bg.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(bg);

    const header = new Graphics();
    header.rect(0, 0, GAME_WIDTH, 50);
    header.fill({ color: 0x5d4037 });
    header.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(header);

    const title = new Text({ text: '🗺 地圖探索', style: this.textStyle(8, '#f4d03f') });
    title.x = 12;
    title.y = 18;
    this.addChild(title);

    this.renderZones();
  }

  update(): void {
    if (!this.visible) return;
    this.renderZones();
  }

  private renderZones(): void {
    const toRemove = this.children.slice(3);
    toRemove.forEach(c => c.destroy());

    const prog = MapSystem_getProgress();
    const zones = MapSystem_getZones();
    let y = 60;

    for (const zone of zones) {
      const card = this.buildZoneCard(zone, prog, y);
      this.addChild(card);
      y += 76;
    }
  }

  private buildZoneCard(zone: typeof ZONES[0], _prog: ReturnType<typeof MapSystem_getProgress>, y: number): Container {
    const card = new Container();
    card.y = y;

    const unlocked = MapSystem_isZoneUnlocked(zone.id);
    const cleared = MapSystem_isZoneCleared(zone.id);
    const isSelected = this.selectedZoneId === zone.id;

    const bg = new Graphics();
    bg.roundRect(0, 0, GAME_WIDTH - 24, 68, 4);
    bg.fill({ color: cleared ? 0xf4d03f : unlocked ? 0xfaf0e6 : 0xd2b48c, alpha: cleared ? 0.2 : 1 });
    bg.stroke({ color: isSelected ? 0x3498DB : cleared ? 0xf4d03f : unlocked ? 0x27AE60 : 0x8b7355, width: isSelected ? 3 : 2 });
    card.addChild(bg);

    // Zone icon
    const ico = new Text({ text: zone.icon, style: { fontSize: 32 } });
    ico.x = 8;
    ico.y = 8;
    card.addChild(ico);

    // Zone name
    const nameTxt = new Text({ text: zone.name, style: this.textStyle(7, 0x5d4037) });
    nameTxt.x = 56;
    nameTxt.y = 4;
    card.addChild(nameTxt);

    // Difficulty stars
    const stars = '★'.repeat(zone.difficulty) + '☆'.repeat(5 - zone.difficulty);
    const starsTxt = new Text({ text: stars, style: { fontSize: 20, fill: 0xf4d03f } });
    starsTxt.x = 56;
    starsTxt.y = 18;
    card.addChild(starsTxt);

    // Recommended level
    const recTxt = new Text({ text: `推薦等級 Lv.${zone.recommendedLevel}+`, style: this.textStyle(5, 0x8b7355) });
    recTxt.x = 56;
    recTxt.y = 42;
    card.addChild(recTxt);

    // Status indicator
    if (!unlocked) {
      const lockedTxt = new Text({ text: '🔒 鎖定', style: this.textStyle(6, 0x8b7355) });
      lockedTxt.x = 300;
      lockedTxt.y = 24;
      card.addChild(lockedTxt);
    } else if (cleared) {
      const clearedTxt = new Text({ text: '✓ 已通關', style: this.textStyle(6, 0x27AE60) });
      clearedTxt.x = 300;
      clearedTxt.y = 24;
      card.addChild(clearedTxt);
    } else {
      // Selectable zone button
      const selectBtn = new Graphics();
      selectBtn.x = 300;
      selectBtn.y = 16;
      selectBtn.eventMode = 'static';
      selectBtn.cursor = 'pointer';
      selectBtn.beginFill(isSelected ? 0x3498DB : 0xf4d03f, 0.3);
      selectBtn.drawRoundedRect(0, 0, isSelected ? 100 : 80, 28, 4);
      selectBtn.endFill();
      selectBtn.on('pointerdown', () => {
        this.selectedZoneId = zone.id;
        this.onZoneSelect(zone.id);
        this.renderZones();
      });
      card.addChild(selectBtn);

      const selectTxt = new Text({ text: isSelected ? '已選擇' : '選擇', style: this.textStyle(6, 0x5d4037) });
      selectTxt.x = isSelected ? 315 : 320;
      selectTxt.y = 22;
      card.addChild(selectTxt);
    }

    return card;
  }

  getSelectedZone(): number {
    return this.selectedZoneId;
  }
}