import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH } from '../../PixiApp';
import { ITEMS } from '../../data/gameData';
import { ShopSystem_getItems, ShopSystem_getInventory, ShopSystem_craftItem } from '../../systems/ShopSystem';
import { ResourceSystem_canAfford } from '../../systems/ResourceSystem';

export class ShopPanel extends Container {
  public onCraft: (itemId: string) => void = () => {};

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

    const title = new Text({ text: '🛒 工坊商店', style: this.textStyle(8, '#f4d03f') });
    title.x = 12;
    title.y = 18;
    this.addChild(title);

    this.renderShop();
  }

  update(): void {
    if (!this.visible) return;
    this.renderShop();
  }

  private renderShop(): void {
    const toRemove = this.children.slice(3);
    toRemove.forEach(c => c.destroy());

    const items = ShopSystem_getItems();
    const inv = ShopSystem_getInventory();
    let y = 60;

    for (const item of items) {
      const card = this.buildShopItemCard(item, inv, y);
      this.addChild(card);
      y += 80;
    }

    // Inventory section
    y += 10;
    const invTitle = new Text({ text: '📦 我的物品', style: this.textStyle(7, 0x8b7355) });
    invTitle.y = y;
    this.addChild(invTitle);
    y += 30;

    const invEntries = Object.entries(inv).filter(([, qty]) => (qty as number) > 0);
    if (invEntries.length === 0) {
      const empty = new Text({ text: '暫無物品', style: this.textStyle(6, 0x8b7355) });
      empty.y = y;
      this.addChild(empty);
      return;
    }

    for (const [itemId, qty] of invEntries) {
      const it = ITEMS[itemId];
      if (!it) continue;

      const row = new Graphics();
      row.y = y;
      row.beginFill(0xfaf0e6, 0.5);
      row.drawRect(12, 0, GAME_WIDTH - 24, 32);
      row.endFill();
      this.addChild(row);

      const ico = new Text({ text: it.icon, style: { fontSize: 18 } });
      ico.x = 20;
      ico.y = 4;
      this.addChild(ico);

      const nameTxt = new Text({ text: it.name, style: this.textStyle(6, 0x5d4037) });
      nameTxt.x = 50;
      nameTxt.y = 6;
      this.addChild(nameTxt);

      const qtyTxt = new Text({ text: `×${qty}`, style: this.textStyle(7, 0x8b7355) });
      qtyTxt.x = 340;
      qtyTxt.y = 6;
      this.addChild(qtyTxt);

      y += 36;
    }
  }

  private buildShopItemCard(item: typeof ITEMS[keyof typeof ITEMS], inv: ReturnType<typeof ShopSystem_getInventory>, y: number): Container {
    const card = new Container();
    card.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, GAME_WIDTH - 24, 72, 4);
    bg.fill({ color: 0xfaf0e6 });
    bg.stroke({ color: 0x8b5a2b, width: 1 });
    card.addChild(bg);

    // Icon
    const ico = new Text({ text: item.icon, style: { fontSize: 36 } });
    ico.x = 8;
    ico.y = 8;
    card.addChild(ico);

    // Name & stock
    const nameTxt = new Text({ text: item.name, style: this.textStyle(7, 0x5d4037) });
    nameTxt.x = 56;
    nameTxt.y = 4;
    card.addChild(nameTxt);

    const stockTxt = new Text({
      text: `庫存: ${inv[item.id] || 0}`,
      style: this.textStyle(5, 0x8b7355),
    });
    stockTxt.x = 56;
    stockTxt.y = 18;
    card.addChild(stockTxt);

    // Cost
    const costEntries = Object.entries(item.cost);
    let costX = 56;
    for (const [, amt] of costEntries) {
      const costTxt = new Text({ text: `${amt}`, style: this.textStyle(5, 0x8b7355) });
      costTxt.x = costX;
      costTxt.y = 34;
      card.addChild(costTxt);
      costX += 50;
    }

    // Craft button
    const canCraft = ResourceSystem_canAfford(item.cost);
    const btn = new Graphics();
    btn.x = 240;
    btn.y = 20;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.beginFill(canCraft ? 0xf4d03f : 0x8b7355, canCraft ? 0.3 : 0.1);
    btn.drawRoundedRect(0, 0, 110, 28, 4);
    btn.endFill();
    btn.on('pointerdown', () => {
      if (ShopSystem_craftItem(item.id)) {
        this.onCraft(item.id);
        this.renderShop();
      }
    });
    card.addChild(btn);

    const btnTxt = new Text({ text: `製作 ${item.price}g`, style: this.textStyle(5, 0x5d4037) });
    btnTxt.x = 265;
    btnTxt.y = 28;
    card.addChild(btnTxt);

    return card;
  }
}