import type { GameState } from '../data/gameData';
import { ResourceSystem_getAll } from './ResourceSystem';
import { BuildingSystem_getLevel } from './BuildingSystem';
import { HeroSystem_getTerritoryHeroes, HeroSystem_getWanderingHeroes, HeroSystem_getNextWanderingSpawnIn } from './HeroSystem';
import { MapSystem_getProgress } from './MapSystem';
import { ShopSystem_getInventory } from './ShopSystem';

// ═══════════════════════════════════════════════════════════════
// SAVE / LOAD SYSTEM
// ═══════════════════════════════════════════════════════════════

const SAVE_KEY = 'kingdomBuilderSavePixi';

export function SaveManager_save(): boolean {
  try {
    const gameState: Record<string, unknown> = {
      version: 1,
      lastOnline: Date.now(),
      resources: ResourceSystem_getAll(),
      heroes: HeroSystem_getTerritoryHeroes(),
      wanderingHeroes: HeroSystem_getWanderingHeroes(),
      buildings: {
        monument: { level: BuildingSystem_getLevel('monument') },
        tavern: { level: BuildingSystem_getLevel('tavern') },
        weaponShop: { level: BuildingSystem_getLevel('weaponShop') },
        potionShop: { level: BuildingSystem_getLevel('potionShop') },
        armorShop: { level: BuildingSystem_getLevel('armorShop') },
      },
      mapProgress: MapSystem_getProgress(),
      shopInventory: ShopSystem_getInventory(),
      nextWanderingSpawnIn: HeroSystem_getNextWanderingSpawnIn(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    return true;
  } catch (e) {
    console.error('[SaveManager] Save failed:', e);
    return false;
  }
}

export function SaveManager_load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.error('[SaveManager] Load failed:', e);
    return null;
  }
}

export function SaveManager_delete(): void {
  localStorage.removeItem(SAVE_KEY);
}