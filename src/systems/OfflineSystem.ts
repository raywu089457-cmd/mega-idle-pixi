import { MATERIAL_TYPES, ZONES, type GameState } from '../data/gameData';
import { ResourceSystem_add } from './ResourceSystem';
import { MapSystem_completeZone } from './MapSystem';
import { HeroSystem_getTerritoryHero, HeroSystem_getTerritoryHeroes, HeroSystem_processWanderingOffline } from './HeroSystem';

// ═══════════════════════════════════════════════════════════════
// OFFLINE SYSTEM
// ═══════════════════════════════════════════════════════════════

let lastOnlineTimestamp = Date.now();
let isOffline = false;
const MAX_OFFLINE = 8 * 3600; // 8 hours cap
const OFFLINE_EFF = 0.5;

export interface OfflineSummary {
  totalSeconds: number;
  cappedSeconds: number;
  isCapped: boolean;
  materialsProduced: Record<string, number>;
  goldProduced: number;
  magicStonesProduced: number;
  heroExplorationGold: number;
  heroExplorationMaterials: Record<string, number>;
  heroWanderingGold: number;
  zonesCleared: number;
  heroesHealed: number;
}

export function OfflineSystem_init(savedState?: GameState): void {
  lastOnlineTimestamp = savedState?.lastOnline || Date.now();
}

export function OfflineSystem_markOffline(): void {
  lastOnlineTimestamp = Date.now();
  isOffline = true;
}

export function OfflineSystem_calculateOfflineProgress(returnTime: number, _monumentLevel = 1): OfflineSummary {
  const total = Math.floor((returnTime - lastOnlineTimestamp) / 1000);
  const capped = Math.min(total, MAX_OFFLINE);

  // --- Flat material / gold production (existing logic) ---
  const matP: Record<string, number> = {};
  for (const mat of MATERIAL_TYPES) {
    const v = 0.8 + Math.random() * 0.4;
    const p = Math.floor(2 * capped * v * OFFLINE_EFF);
    matP[mat] = p;
    ResourceSystem_add(mat, p);
  }

  const flatGold = Math.floor(50 * (capped / 60) * OFFLINE_EFF);
  ResourceSystem_add('gold', flatGold);

  const flatMagic = Math.floor(Math.random() * 3);
  if (flatMagic > 0) ResourceSystem_add('magicStones', flatMagic);

  // --- Hero simulation during offline time ---
  const heroResult = simulateOfflineHeroes(capped);

  return {
    totalSeconds: total,
    cappedSeconds: capped,
    isCapped: total > MAX_OFFLINE,
    materialsProduced: matP,
    goldProduced: flatGold + heroResult.gold,
    magicStonesProduced: flatMagic + heroResult.magicStones,
    heroExplorationGold: heroResult.explorationGold,
    heroExplorationMaterials: heroResult.materials,
    heroWanderingGold: heroResult.wanderingGold,
    zonesCleared: heroResult.zonesCleared,
    heroesHealed: heroResult.heroesHealed,
  };
}

export function OfflineSystem_markOnline(): OfflineSummary | null {
  if (!isOffline) return null;
  const away = Math.floor((Date.now() - lastOnlineTimestamp) / 1000);
  if (away < 60) {
    isOffline = false;
    return null;
  }
  const summary = OfflineSystem_calculateOfflineProgress(Date.now());
  isOffline = false;
  return summary;
}

/** Called on initial page load (not visibilitychange) to process offline time */
export function OfflineSystem_processInitialOffline(): OfflineSummary | null {
  const now = Date.now();
  const away = Math.floor((now - lastOnlineTimestamp) / 1000);
  if (away < 60) {
    isOffline = false;
    return null;
  }
  const summary = OfflineSystem_calculateOfflineProgress(now);
  isOffline = false;
  return summary;
}

// ═══════════════════════════════════════════════════════════════
// HERO OFFLINE SIMULATION
// ═══════════════════════════════════════════════════════════════

interface HeroOfflineResult {
  gold: number;
  explorationGold: number;
  materials: Record<string, number>;
  magicStones: number;
  wanderingGold: number;
  zonesCleared: number;
  heroesHealed: number;
}

function simulateOfflineHeroes(cappedSeconds: number): HeroOfflineResult {
  const result: HeroOfflineResult = {
    gold: 0,
    explorationGold: 0,
    materials: {},
    magicStones: 0,
    wanderingGold: 0,
    zonesCleared: 0,
    heroesHealed: 0,
  };

  // ── Territory heroes ──
  const territoryIds = HeroSystem_getTerritoryHeroes().map(h => h.id);
  for (const heroId of territoryIds) {
    const hero = HeroSystem_getTerritoryHero(heroId);
    if (!hero) continue;

    // Exploring heroes: advance progress, handle zone completions, take combat damage
    if (hero.status === 'exploring' && hero.currentZone) {
      const zone = ZONES.find(z => z.id === hero.currentZone);
      if (zone) {
        const progressPerTick = 0.5 + (hero.atk + hero.def) / 2 / 100;
        const accumulated = (hero.explorationProgress || 0) + progressPerTick * cappedSeconds;
        const completions = Math.floor(accumulated / 100);
        hero.explorationProgress = accumulated % 100;

        for (let c = 0; c < completions; c++) {
          // Zone completion rewards
          const gR = zone.rewards.gold.min + Math.floor(Math.random() * (zone.rewards.gold.max - zone.rewards.gold.min));
          ResourceSystem_add('gold', gR);
          result.gold += gR;
          result.explorationGold += gR;

          for (const mat of zone.rewards.materials) {
            const a = Math.floor(Math.random() * 5) + 1;
            ResourceSystem_add(mat, a);
            result.materials[mat] = (result.materials[mat] || 0) + a;
          }

          if (Math.random() < zone.magicStoneChance) {
            const mSD = Math.floor(Math.random() * 3) + 1;
            ResourceSystem_add('magicStones', mSD);
            result.magicStones += mSD;
          }

          result.zonesCleared++;
        }

        // Per-tick combat victory rewards during exploration
        // Matches the combat mechanics in HeroSystem.processExplorationTick
        const combatTicks = cappedSeconds * 0.9;
        const eDef = 2 + zone.difficulty * 3 + hero.level * 2;
        const eAtk = 3 + zone.difficulty * 4 + hero.level * 2;
        const eHpVal = 30 + zone.difficulty * 25 + hero.level * 5;
        const heroDmgPerRound = Math.max(1, hero.atk - eDef + 2);
        const enemyDmgPerRound = Math.max(1, eAtk - hero.def + 2);
        const roundsToKill = Math.ceil(eHpVal / heroDmgPerRound);
        const roundsToDie = hero.hp > 0 ? Math.ceil(hero.hp / enemyDmgPerRound) : 999;
        const winRate = Math.min(1, Math.max(0.1, roundsToDie / (roundsToDie + roundsToKill)));
        const combatVictories = Math.floor(combatTicks * winRate);
        if (combatVictories > 0) {
          const goldPerWin = zone.difficulty * 15 + hero.level * 5;
          const combatGold = combatVictories * goldPerWin;
          ResourceSystem_add('gold', combatGold);
          result.gold += combatGold;
          result.explorationGold += combatGold;
          for (const mat of zone.rewards.materials) {
            const matAmt = Math.floor(combatVictories * (Math.random() * 0.8 + 0.5));
            ResourceSystem_add(mat, matAmt);
            result.materials[mat] = (result.materials[mat] || 0) + matAmt;
          }
          const msProb = 1 - Math.pow(1 - zone.magicStoneChance, combatVictories);
          if (Math.random() < msProb) {
            const stones = Math.floor(Math.random() * 3) + 1;
            ResourceSystem_add('magicStones', stones);
            result.magicStones += stones;
          }
        }
        // Combat damage: 90% of ticks encounter an enemy
        const avgEnemyAtk = 3 + zone.difficulty * 4 + hero.level * 2;
        const avgDmg = Math.max(1, avgEnemyAtk - hero.def + 2);
        const totalDmg = Math.floor(combatTicks * avgDmg);
        hero.hp = Math.max(1, hero.hp - totalDmg);

        if (hero.hp <= 1) {
          hero.status = 'resting';
          hero.currentZone = null;
          hero.explorationProgress = 0;
        }

        // After combat processed: if zone was completed, mark cleared and set hero idle
        if (completions > 0) {
          MapSystem_completeZone(zone.id);
          hero.status = 'idle';
          hero.currentZone = null;
          hero.explorationProgress = 0;
        }
      }
    }

    // Resting heroes: recover HP
    if (hero.status === 'resting') {
      const hpRecovery = Math.ceil(hero.maxHp * 0.001) * cappedSeconds;
      hero.hp = Math.min(hero.maxHp, hero.hp + hpRecovery);
      if (hero.hp >= hero.maxHp * 0.8) {
        hero.status = 'idle';
        result.heroesHealed++;
      }
    }
  }

  // ── Wandering heroes ──
  const wResult = HeroSystem_processWanderingOffline(cappedSeconds);
  result.wanderingGold = wResult.goldProduced;
  result.gold += wResult.goldProduced;
  result.magicStones += wResult.magicStonesProduced;

  return result;
}
