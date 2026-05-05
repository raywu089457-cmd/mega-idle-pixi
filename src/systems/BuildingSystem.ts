import { BUILDINGS, getBuildingCost, type GameState } from '../data/gameData';
import { ResourceSystem_spend } from './ResourceSystem';

// ═══════════════════════════════════════════════════════════════
// BUILDING SYSTEM
// ═══════════════════════════════════════════════════════════════

interface BuildingState {
  level: number;
}

let buildingStates: Record<string, BuildingState> = {};

export function BuildingSystem_init(savedState?: GameState): void {
  const saved = savedState?.buildings as Record<string, { level: number }> | undefined;
  const defaults = { monument: { level: 1 }, tavern: { level: 1 }, weaponShop: { level: 1 }, potionShop: { level: 1 }, armorShop: { level: 1 } };
  for (const [id, def] of Object.entries(defaults)) {
    buildingStates[id] = { level: saved?.[id]?.level ?? def.level };
  }
}

export function BuildingSystem_getLevel(id: string): number {
  return buildingStates[id]?.level ?? 1;
}

export interface BuildingInfo {
  id: string;
  name: string;
  description: string;
  effect: string;
  level: number;
  maxLevel: number;
  cost: Record<string, number> | null;
  canUpgrade: boolean;
  icon: string;
  effectText: string;
}

export function BuildingSystem_getAll(): Record<string, BuildingInfo> {
  const r: Record<string, BuildingInfo> = {};
  for (const [id, state] of Object.entries(buildingStates)) {
    const def = BUILDINGS[id];
    if (!def) continue;
    r[id] = {
      id,
      name: def.name,
      description: def.description,
      effect: def.effectText,
      level: state.level,
      maxLevel: def.maxLevel,
      cost: getBuildingCost(id, state.level + 1),
      canUpgrade: state.level < def.maxLevel,
      icon: def.icon,
      effectText: def.effectText,
    };
  }
  return r;
}

export function BuildingSystem_upgrade(id: string): boolean {
  const def = BUILDINGS[id];
  if (!def) return false;
  const cur = BuildingSystem_getLevel(id);
  if (cur >= def.maxLevel) return false;
  const cost = getBuildingCost(id, cur + 1);
  if (!cost || !ResourceSystem_spend(cost)) return false;
  buildingStates[id].level += 1;
  return true;
}

export function BuildingSystem_getWanderingSpawnInterval(): number {
  return Math.max(2, 12 - BuildingSystem_getLevel('tavern') * 2);
}

export function BuildingSystem_getMaxWanderingHeroes(): number {
  return Math.min(5, 2 + BuildingSystem_getLevel('tavern'));
}

export function BuildingSystem_getTerritoryHeroSlots(currentCount = 0): { current: number; max: number } {
  const t = BuildingSystem_getLevel('tavern');
  return { current: currentCount, max: 3 + (t - 1) * 2 };
}