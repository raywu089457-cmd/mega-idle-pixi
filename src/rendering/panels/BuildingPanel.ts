import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH } from '../../PixiApp';
import { BuildingSystem_getAll, BuildingSystem_upgrade } from '../../systems/BuildingSystem';
import { ResourceSystem_canAfford } from '../../systems/ResourceSystem';

export class BuildingPanel extends Container {
  private bg!: Graphics;
  public onUpgrade: (buildingId: string) => void = () => {};

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
    this.bg = new Graphics();
    this.bg.rect(0, 0, GAME_WIDTH, 400);
    this.bg.fill({ color: 0xfaf0e6 });
    this.bg.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(this.bg);

    const header = new Graphics();
    header.rect(0, 0, GAME_WIDTH, 50);
    header.fill({ color: 0x5d4037 });
    header.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(header);

    const title = new Text({ text: '🏗 建築', style: this.textStyle(8, '#f4d03f') });
    title.x = 12;
    title.y = 18;
    this.addChild(title);

    this.renderBuildings();
  }

  update(): void {
    if (!this.visible) return;
    this.renderBuildings();
  }

  private renderBuildings(): void {
    // Remove old cards (except background elements)
    const toRemove = this.children.slice(3);
    toRemove.forEach(c => c.destroy());

    const buildings = BuildingSystem_getAll();
    let y = 60;

    for (const [, b] of Object.entries(buildings)) {
      const card = this.buildBuildingCard(b, y);
      this.addChild(card);
      y += 90;
    }
  }

  private buildBuildingCard(b: ReturnType<typeof BuildingSystem_getAll>[string], y: number): Container {
    const card = new Container();
    card.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, GAME_WIDTH - 24, 82, 4);
    bg.fill({ color: 0xfaf0e6 });
    bg.stroke({ color: 0x8b5a2b, width: 1 });
    card.addChild(bg);

    // Icon
    const ico = new Text({ text: b.icon, style: { fontSize: 36 } });
    ico.x = 8;
    ico.y = 8;
    card.addChild(ico);

    // Name & Level
    const nameTxt = new Text({ text: b.name, style: this.textStyle(6, 0x5d4037) });
    nameTxt.x = 56;
    nameTxt.y = 4;
    card.addChild(nameTxt);

    const lvlTxt = new Text({
      text: b.canUpgrade ? `Lv.${b.level}` : 'MAX',
      style: this.textStyle(6, b.canUpgrade ? 0x27AE60 : 0xe74c3c),
    });
    lvlTxt.x = 200;
    lvlTxt.y = 4;
    card.addChild(lvlTxt);

    // Description
    const descTxt = new Text({ text: b.description, style: this.textStyle(5, 0x8b7355) });
    descTxt.x = 56;
    descTxt.y = 16;
    descTxt.width = 180;
    card.addChild(descTxt);

    // Effect
    const effectTxt = new Text({ text: b.effectText, style: this.textStyle(5, 0x27AE60) });
    effectTxt.x = 56;
    effectTxt.y = 32;
    card.addChild(effectTxt);

    if (b.canUpgrade && b.cost) {
      // Cost display
      const costEntries = Object.entries(b.cost);
      let costX = 56;
      for (const [, amt] of costEntries) {
        const costTxt = new Text({ text: `${amt}`, style: this.textStyle(5, 0x8b7355) });
        costTxt.x = costX;
        costTxt.y = 46;
        card.addChild(costTxt);
        costX += 40;
      }

      // Upgrade button
      const canAfford = ResourceSystem_canAfford(b.cost);
      const btn = new Graphics();
      btn.x = 240;
      btn.y = 36;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.beginFill(canAfford ? 0xf4d03f : 0x8b7355, canAfford ? 0.3 : 0.1);
      btn.drawRoundedRect(0, 0, 100, 28, 4);
      btn.endFill();
      btn.on('pointerdown', () => {
        if (BuildingSystem_upgrade(b.id)) {
          this.onUpgrade(b.id);
          this.renderBuildings();
        }
      });
      card.addChild(btn);

      const btnTxt = new Text({ text: `升級 Lv.${b.level + 1}`, style: this.textStyle(5, 0x5d4037) });
      btnTxt.x = 260;
      btnTxt.y = 44;
      card.addChild(btnTxt);
    } else {
      const maxBadge = new Text({ text: '✦ MAX LEVEL ✦', style: this.textStyle(5, 0xe74c3c) });
      maxBadge.x = 240;
      maxBadge.y = 44;
      card.addChild(maxBadge);
    }

    return card;
  }
}