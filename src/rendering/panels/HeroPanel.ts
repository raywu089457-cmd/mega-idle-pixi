import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH } from '../../PixiApp';
import { HERO_CLASSES, type Hero } from '../../data/gameData';
import { HeroSystem_getTerritoryHeroes, HeroSystem_getWanderingHeroes, HeroSystem_getRecruitCost, HeroSystem_recruitWanderingHero } from '../../systems/HeroSystem';
import { BuildingSystem_getTerritoryHeroSlots } from '../../systems/BuildingSystem';

const TERRITORY = 'hero-territory';
const WANDER = 'hero-wander';

export class HeroPanel extends Container {
  private bg!: Graphics;
  private tabBtns: Graphics[] = [];
  private underline!: Graphics;
  private activeTab: string = TERRITORY;
  private heroCards: Container = new Container();

  // Callbacks
  public onTrain: (heroId: string) => void = () => {};
  public onDispatch: (heroId: string) => void = () => {};

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

    // Header
    const header = new Graphics();
    header.rect(0, 0, GAME_WIDTH, 50);
    header.fill({ color: 0x5d4037 });
    header.stroke({ color: 0x2c2c2c, width: 2 });
    this.addChild(header);

    const title = new Text({ text: '⚔ 英雄', style: this.textStyle(8, '#f4d03f') });
    title.x = 12;
    title.y = 18;
    this.addChild(title);

    // Tabs
    const tabsY = 50;
    const tabW = GAME_WIDTH / 2;
    const tabs = [TERRITORY, WANDER];
    const tabLabels = ['領地英雄', '流浪英雄'];

    for (let i = 0; i < tabs.length; i++) {
      const tabBtn = new Graphics();
      tabBtn.x = i * tabW;
      tabBtn.y = tabsY;
      tabBtn.eventMode = 'static';
      tabBtn.cursor = 'pointer';

      tabBtn.on('pointerdown', () => {
        this.activeTab = tabs[i];
        this.renderHeroes();
      });

      this.tabBtns.push(tabBtn);
      this.addChild(tabBtn);

      const label = new Text({ text: tabLabels[i], style: this.textStyle(6, 0x8b7355) });
      label.x = i * tabW + 10;
      label.y = tabsY + 8;
      this.addChild(label);
    }

    // Underline indicator
    this.underline = new Graphics();
    this.underline.x = 0;
    this.underline.y = tabsY + 30;
    this.addChild(this.underline);

    // Hero cards container
    this.heroCards.x = 12;
    this.heroCards.y = 90;
    this.addChild(this.heroCards);

    this.renderHeroes();
  }

  update(): void {
    if (!this.visible) return;
    this.renderHeroes();
  }

  private renderHeroes(): void {
    this.heroCards.removeChildren();

    const territory = HeroSystem_getTerritoryHeroes();
    const wandering = HeroSystem_getWanderingHeroes();
    const slots = BuildingSystem_getTerritoryHeroSlots(territory.length);

    if (this.activeTab === TERRITORY) {
      // Slot info
      const slotInfo = new Text({
        text: `🏰 英雄空位: ${territory.length}/${slots.max}`,
        style: this.textStyle(6, 0x8b7355),
      });
      this.heroCards.addChild(slotInfo);

      if (territory.length === 0) {
        const empty = new Text({ text: '尚無領土英雄', style: this.textStyle(6, 0x8b7355) });
        empty.y = 40;
        this.heroCards.addChild(empty);
        return;
      }

      let y = 30;
      for (const hero of territory) {
        const card = this.buildTerritoryHeroCard(hero, y);
        this.heroCards.addChild(card);
        y += 80;
      }
    } else {
      // Wandering heroes
      if (wandering.length === 0) {
        const empty = new Text({ text: '目前沒有流浪英雄拜訪', style: this.textStyle(6, 0x8b7355) });
        empty.y = 30;
        this.heroCards.addChild(empty);
        return;
      }

      let y = 20;
      for (const hero of wandering) {
        const card = this.buildWanderHeroCard(hero, y);
        this.heroCards.addChild(card);
        y += 80;
      }
    }

    // Update underline position
    const tabW = GAME_WIDTH / 2;
    const isTerritory = this.activeTab === TERRITORY;
    this.underline.clear();
    this.underline.rect(isTerritory ? 0 : tabW, 0, tabW, 3);
    this.underline.fill({ color: 0xf4d03f });
  }

  private buildTerritoryHeroCard(hero: Hero, y: number): Container {
    const card = new Container();
    card.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, GAME_WIDTH - 24, 70, 4);
    bg.fill({ color: 0xfaf0e6 });
    bg.stroke({ color: 0x8b5a2b, width: 1 });
    card.addChild(bg);

    const cls = HERO_CLASSES[hero.class] || HERO_CLASSES.warrior;

    // Portrait
    const portrait = new Text({ text: cls.icon, style: { fontSize: 36 } });
    portrait.x = 8;
    portrait.y = 8;
    card.addChild(portrait);

    // Name & level
    const nameTxt = new Text({
      text: `${hero.name}  Lv.${hero.level}`,
      style: this.textStyle(7, 0x5d4037),
    });
    nameTxt.x = 56;
    nameTxt.y = 6;
    card.addChild(nameTxt);

    const classTxt = new Text({ text: cls.name, style: this.textStyle(6, 0x8b7355) });
    classTxt.x = 56;
    classTxt.y = 20;
    card.addChild(classTxt);

    // Stats
    const statsTxt = new Text({
      text: `HP ${hero.hp}/${hero.maxHp}  ATK ${hero.atk}  DEF ${hero.def}`,
      style: this.textStyle(5, 0x27AE60),
    });
    statsTxt.x = 56;
    statsTxt.y = 34;
    card.addChild(statsTxt);

    // Status badge
    const statusMap: Record<string, string> = { idle: '待機', exploring: '探索中', resting: '休息中' };
    const statusTxt = new Text({ text: statusMap[hero.status] || hero.status, style: this.textStyle(5, 0x3498DB) });
    statusTxt.x = 200;
    statusTxt.y = 6;
    card.addChild(statusTxt);

    // Action buttons (simple click areas)
    const dispatchBtn = new Graphics();
    dispatchBtn.x = 280;
    dispatchBtn.y = 6;
    dispatchBtn.eventMode = 'static';
    dispatchBtn.cursor = 'pointer';
    dispatchBtn.beginFill(0xf4d03f, 0.2);
    dispatchBtn.drawRoundedRect(0, 0, 70, 24, 4);
    dispatchBtn.endFill();
    dispatchBtn.on('pointerdown', () => this.onDispatch(hero.id));
    card.addChild(dispatchBtn);

    const dispatchTxt = new Text({ text: '出征', style: this.textStyle(6, 0x5d4037) });
    dispatchTxt.x = 290;
    dispatchTxt.y = 12;
    card.addChild(dispatchTxt);

    // Train button
    const trainCost = hero.level * 150;
    const trainBtn = new Graphics();
    trainBtn.x = 280;
    trainBtn.y = 36;
    trainBtn.eventMode = 'static';
    trainBtn.cursor = 'pointer';
    trainBtn.beginFill(0x8b5a2b, 0.2);
    trainBtn.drawRoundedRect(0, 0, 70, 24, 4);
    trainBtn.endFill();
    trainBtn.on('pointerdown', () => this.onTrain(hero.id));
    card.addChild(trainBtn);

    const trainTxt = new Text({ text: `訓練 ${trainCost}g`, style: this.textStyle(5, 0x8b5a2b) });
    trainTxt.x = 286;
    trainTxt.y = 42;
    card.addChild(trainTxt);

    return card;
  }

  private buildWanderHeroCard(hero: Hero, y: number): Container {
    const card = new Container();
    card.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, GAME_WIDTH - 24, 70, 4);
    bg.fill({ color: 0xfaf0e6 });
    bg.stroke({ color: 0x8b5a2b, width: 1 });
    card.addChild(bg);

    const cls = HERO_CLASSES[hero.class] || HERO_CLASSES.warrior;

    const portrait = new Text({ text: cls.icon, style: { fontSize: 36 } });
    portrait.x = 8;
    portrait.y = 8;
    card.addChild(portrait);

    const nameTxt = new Text({
      text: `${hero.name}  Lv.${hero.level}`,
      style: this.textStyle(7, 0x5d4037),
    });
    nameTxt.x = 56;
    nameTxt.y = 6;
    card.addChild(nameTxt);

    const classTxt = new Text({ text: cls.name, style: this.textStyle(6, 0x8b7355) });
    classTxt.x = 56;
    classTxt.y = 20;
    card.addChild(classTxt);

    const statsTxt = new Text({
      text: `HP ${hero.hp}/${hero.maxHp}  ATK ${hero.atk}  DEF ${hero.def}`,
      style: this.textStyle(5, 0x27AE60),
    });
    statsTxt.x = 56;
    statsTxt.y = 34;
    card.addChild(statsTxt);

    const recruitCost = HeroSystem_getRecruitCost(hero.id);
    const recruitBtn = new Graphics();
    recruitBtn.x = 260;
    recruitBtn.y = 20;
    recruitBtn.eventMode = 'static';
    recruitBtn.cursor = 'pointer';
    recruitBtn.beginFill(0xf4d03f, 0.3);
    recruitBtn.drawRoundedRect(0, 0, 90, 28, 4);
    recruitBtn.endFill();
    recruitBtn.on('pointerdown', () => {
      HeroSystem_recruitWanderingHero(hero.id);
      this.renderHeroes();
    });
    card.addChild(recruitBtn);

    const recruitTxt = new Text({ text: `招募 🪙 ${recruitCost}`, style: this.textStyle(5, 0x5d4037) });
    recruitTxt.x = 270;
    recruitTxt.y = 28;
    card.addChild(recruitTxt);

    return card;
  }
}