// ═══════════════════════════════════════════════════════════════
// GAME DATA — Static definitions (移植自 index.html)
// ═══════════════════════════════════════════════════════════════

export const RESOURCES: Record<string, ResourceDef> = {
  gold: { name: 'Gold', icon: '🪙', initial: 500, capacity: 10000 },
  magicStones: { name: 'Ancient Magic Stones', icon: '💎', initial: 0, capacity: 999 },
  fruitPoor: { name: '劣等水果', icon: '🍎', initial: 0, capacity: 500 },
  waterDirty: { name: '髒水', icon: '💧', initial: 0, capacity: 500 },
  woodRotten: { name: '腐朽木頭', icon: '🪵', initial: 0, capacity: 500 },
  ironRusty: { name: '鏽跡斑斑的鐵', icon: '⚙️', initial: 0, capacity: 500 },
  herbLow: { name: '低等藥材', icon: '🌿', initial: 0, capacity: 500 },
};

export const MATERIAL_TYPES = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];

export interface ResourceDef {
  name: string;
  icon: string;
  initial: number;
  capacity: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  nameAlt: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: Record<string, number>;
  costMultiplier: number;
  icon: string;
  effectText: string;
}

export const BUILDINGS: Record<string, BuildingDef> = {
  monument: {
    id: 'monument', name: '古老石碑', nameAlt: 'Ancient Monument',
    description: '古老的石碑，散發著神秘的能量，自動生產各種基礎材料。',
    level: 1, maxLevel: 10,
    baseCost: { gold: 500, woodRotten: 50, ironRusty: 20 },
    costMultiplier: 2.0, icon: '🗿', effectText: '⚡ +2🍎 +1💧 +3🪵/s',
  },
  tavern: {
    id: 'tavern', name: '酒館', nameAlt: 'Tavern',
    description: '熱鬧的酒館吸引流浪英雄，增加招募機會。',
    level: 1, maxLevel: 5,
    baseCost: { gold: 300, woodRotten: 80 },
    costMultiplier: 1.5, icon: '🍺', effectText: '🎲 每日訪客 +2',
  },
  weaponShop: {
    id: 'weaponShop', name: '武器鋪', nameAlt: 'Weapon Shop',
    description: '鑄造各種武器，提升英雄攻擊力。',
    level: 1, maxLevel: 10,
    baseCost: { gold: 200, woodRotten: 50, ironRusty: 30 },
    costMultiplier: 2.0, icon: '⚔️', effectText: '🗡 可製作初級武器',
  },
  potionShop: {
    id: 'potionShop', name: '藥水鋪', nameAlt: 'Potion Shop',
    description: '調配各種藥水，補充英雄體力。',
    level: 1, maxLevel: 10,
    baseCost: { gold: 200, herbLow: 50, waterDirty: 30 },
    costMultiplier: 2.0, icon: '⚗️', effectText: '💊 可製作初級藥水',
  },
  armorShop: {
    id: 'armorShop', name: '鎧甲鋪', nameAlt: 'Armor Shop',
    description: '打造堅固鎧甲，增強英雄防禦力。',
    level: 1, maxLevel: 10,
    baseCost: { gold: 200, ironRusty: 40, woodRotten: 20 },
    costMultiplier: 2.0, icon: '🛡️', effectText: '🛡 最高級防具可製作',
  },
};

export const HERO_CLASSES: Record<string, HeroClassDef> = {
  warrior: { name: '戰士', baseHp: 100, baseAtk: 15, baseDef: 10, icon: '⚔️' },
  mage: { name: '法師', baseHp: 70, baseAtk: 25, baseDef: 5, icon: '🧙' },
  rogue: { name: '盜賊', baseHp: 85, baseAtk: 18, baseDef: 8, icon: '🗡️' },
  cleric: { name: '牧師', baseHp: 90, baseAtk: 10, baseDef: 15, icon: '⛪' },
  ranger: { name: '弓手', baseHp: 80, baseAtk: 20, baseDef: 7, icon: '🏹' },
};

export interface HeroClassDef {
  name: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  icon: string;
}

export const WANDERING_HERO_TYPES = [
  { typeId: 'wandering_warrior_1', class: 'warrior', name: '僱傭士兵', level: 1, dropGold: 20, dropMagicStoneChance: 0.1 },
  { typeId: 'wandering_warrior_2', class: 'warrior', name: '資深僱傭兵', level: 5, dropGold: 50, dropMagicStoneChance: 0.15 },
  { typeId: 'wandering_mage_1', class: 'mage', name: '流浪法師', level: 2, dropGold: 25, dropMagicStoneChance: 0.12 },
  { typeId: 'wandering_mage_2', class: 'mage', name: '雲游術士', level: 7, dropGold: 60, dropMagicStoneChance: 0.18 },
  { typeId: 'wandering_rogue_1', class: 'rogue', name: '街頭頑童', level: 1, dropGold: 15, dropMagicStoneChance: 0.08 },
  { typeId: 'wandering_rogue_2', class: 'rogue', name: '盜賊大師', level: 8, dropGold: 70, dropMagicStoneChance: 0.2 },
];

export const ZONES = [
  { id: 1, name: '平靜郊野', nameAlt: 'Countryside', difficulty: 1, recommendedLevel: 1, rewards: { gold: { min: 50, max: 100 }, materials: ['fruitPoor', 'waterDirty'] }, magicStoneChance: 0.1, icon: '🌾' },
  { id: 2, name: '黑暗森林', nameAlt: 'Dark Forest', difficulty: 2, recommendedLevel: 3, rewards: { gold: { min: 100, max: 200 }, materials: ['woodRotten', 'herbLow'] }, magicStoneChance: 0.15, icon: '🌲' },
  { id: 3, name: '廢棄礦坑', nameAlt: 'Abandoned Mine', difficulty: 3, recommendedLevel: 5, rewards: { gold: { min: 150, max: 300 }, materials: ['ironRusty', 'woodRotten'] }, magicStoneChance: 0.2, icon: '⛏' },
  { id: 4, name: '沼澤深淵', nameAlt: 'Swamp Depths', difficulty: 4, recommendedLevel: 7, rewards: { gold: { min: 200, max: 400 }, materials: ['herbLow', 'waterDirty'] }, magicStoneChance: 0.25, icon: '🏚' },
  { id: 5, name: '龍族廢墟', nameAlt: 'Dragon Ruins', difficulty: 5, recommendedLevel: 10, rewards: { gold: { min: 300, max: 600 }, materials: ['ironRusty', 'magicStones'] }, magicStoneChance: 0.3, icon: '🐉' },
];

export const ITEMS: Record<string, ItemDef> = {
  woodenSword: { id: 'woodenSword', name: '木製劍', type: 'weapon', price: 30, cost: { woodRotten: 30, ironRusty: 10 }, icon: '🗡️' },
  ironDagger: { id: 'ironDagger', name: '鐵匕首', type: 'weapon', price: 80, cost: { ironRusty: 40, gold: 200 }, icon: '🔪' },
  healthPotion: { id: 'healthPotion', name: '生命藥水', type: 'potion', price: 25, cost: { herbLow: 20, waterDirty: 15 }, icon: '🧪' },
  ironArmor: { id: 'ironArmor', name: '鐵甲', type: 'armor', price: 120, cost: { ironRusty: 80, gold: 600 }, icon: '🛡️' },
  mysticStaff: { id: 'mysticStaff', name: '神秘法杖', type: 'weapon', price: 150, cost: { magicStones: 5, herbLow: 50 }, icon: '🔮' },
};

export interface ItemDef {
  id: string;
  name: string;
  type: string;
  price: number;
  cost: Record<string, number>;
  icon: string;
}

export function getBuildingCost(buildingId: string, targetLevel: number): Record<string, number> | null {
  const building = BUILDINGS[buildingId];
  if (!building) return null;
  const multiplier = Math.pow(building.costMultiplier, targetLevel - 1);
  const cost: Record<string, number> = {};
  for (const [resourceId, baseAmount] of Object.entries(building.baseCost)) {
    cost[resourceId] = Math.floor(baseAmount * multiplier);
  }
  return cost;
}

export interface Hero {
  id: string;
  isTerritory: boolean;
  class: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  status: 'idle' | 'exploring' | 'resting' | 'wandering';
  currentZone: number | null;
  explorationProgress: number;
  typeId?: string;
  dropGold?: number;
  dropMagicStoneChance?: number;
  ticksUntilStateChange?: number;
}

export function createTerritoryHero(classType: string, name: string, level = 1): Hero | null {
  const classDef = HERO_CLASSES[classType];
  if (!classDef) return null;
  return {
    id: 'territory_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    isTerritory: true, class: classType,
    name: name || (classDef.name + ' #' + Math.floor(Math.random() * 1000)),
    level,
    hp: classDef.baseHp + (level - 1) * 10,
    maxHp: classDef.baseHp + (level - 1) * 10,
    atk: classDef.baseAtk + (level - 1) * 3,
    def: classDef.baseDef + (level - 1) * 2,
    status: 'idle', currentZone: null, explorationProgress: 0,
  };
}

export function createWanderingHero(typeDef: typeof WANDERING_HERO_TYPES[0]): Hero {
  const classDef = HERO_CLASSES[typeDef.class];
  return {
    id: 'wandering_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    isTerritory: false, typeId: typeDef.typeId, class: typeDef.class,
    name: typeDef.name, level: typeDef.level,
    hp: classDef.baseHp + (typeDef.level - 1) * 10,
    maxHp: classDef.baseHp + (typeDef.level - 1) * 10,
    atk: classDef.baseAtk + (typeDef.level - 1) * 3,
    def: classDef.baseDef + (typeDef.level - 1) * 2,
    status: 'wandering', currentZone: null, explorationProgress: 0,
    dropGold: typeDef.dropGold,
    dropMagicStoneChance: typeDef.dropMagicStoneChance,
    ticksUntilStateChange: Math.floor(Math.random() * 120) + 60,
  };
}

export function getDefaultGameState() {
  return {
    version: 1,
    lastOnline: Date.now(),
    resources: { gold: 500, magicStones: 0, fruitPoor: 0, waterDirty: 0, woodRotten: 0, ironRustty: 0, herbLow: 0 },
    heroes: [] as Hero[],
    wanderingHeroes: [] as Hero[],
    buildings: { monument: { level: 1 }, tavern: { level: 1 }, weaponShop: { level: 1 }, potionShop: { level: 1 }, armorShop: { level: 1 } },
    mapProgress: { currentZone: 1, unlockedZones: [1], clearedZones: [] as number[] },
    shopInventory: {} as Record<string, number>,
    tickCount: 0,
  };
}

export type GameState = ReturnType<typeof getDefaultGameState>;