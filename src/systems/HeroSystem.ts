import { WANDERING_HERO_TYPES, ZONES, createTerritoryHero, createWanderingHero, type Hero, type GameState } from '../data/gameData';
import { ResourceSystem_add, ResourceSystem_spend } from './ResourceSystem';
import { BuildingSystem_getMaxWanderingHeroes, BuildingSystem_getTerritoryHeroSlots, BuildingSystem_getWanderingSpawnInterval } from './BuildingSystem';

// ═══════════════════════════════════════════════════════════════
// HERO SYSTEM
// ═══════════════════════════════════════════════════════════════

let territoryHeroes: Hero[] = [];
let wanderingHeroes: Hero[] = [];
let nextWanderingSpawnIn = 0;
let heroListeners: Array<(event: { type: string; hero?: Hero; data?: unknown }) => void> = [];
const BW = { fighting: 0.60, shopping: 0.30, leaving: 0.10 };

function getRandomSpawnTime(): number {
  const interval = BuildingSystem_getWanderingSpawnInterval();
  return Math.floor(Math.random() * interval) + interval;
}

export function HeroSystem_init(savedState?: GameState): void {
  territoryHeroes = savedState?.heroes || [];
  wanderingHeroes = savedState?.wanderingHeroes || [];
  nextWanderingSpawnIn = savedState?.nextWanderingSpawnIn || getRandomSpawnTime();
}

export function HeroSystem_addTerritoryHero(hero: Hero): boolean {
  const slots = BuildingSystem_getTerritoryHeroSlots(territoryHeroes.length);
  if (territoryHeroes.length >= slots.max) return false;
  territoryHeroes.push(hero);
  return true;
}

export function HeroSystem_getTerritoryHeroes(): Hero[] {
  return [...territoryHeroes];
}

export function HeroSystem_getTerritoryHero(id: string): Hero | null {
  return territoryHeroes.find(h => h.id === id) || null;
}

export function HeroSystem_sendToExplore(id: string, zoneId: number): boolean {
  const h = HeroSystem_getTerritoryHero(id);
  if (!h || h.status !== 'idle') return false;
  h.status = 'exploring';
  h.currentZone = zoneId;
  h.explorationProgress = 0;
  return true;
}

export function HeroSystem_returnToIdle(id: string): void {
  const h = HeroSystem_getTerritoryHero(id);
  if (!h) return;
  h.status = 'idle';
  h.currentZone = null;
  h.explorationProgress = 0;
}

export function HeroSystem_trainHero(id: string, cost: Record<string, number>): boolean {
  const h = HeroSystem_getTerritoryHero(id);
  if (!h || !ResourceSystem_spend(cost)) return false;
  h.level += 1;
  h.maxHp += 10;
  h.hp = h.maxHp;
  h.atk += 3;
  h.def += 2;
  return true;
}

export function HeroSystem_getWanderingHeroes(): Hero[] {
  return [...wanderingHeroes];
}

export function HeroSystem_recruitWanderingHero(id: string): boolean {
  const idx = wanderingHeroes.findIndex(h => h.id === id);
  if (idx === -1) return false;
  const slots = BuildingSystem_getTerritoryHeroSlots(territoryHeroes.length);
  if (territoryHeroes.length >= slots.max) return false;
  const w = wanderingHeroes[idx];
  const rc = w.level * 100;
  if (!ResourceSystem_spend({ gold: rc })) return false;
  const t = createTerritoryHero(w.class, w.name, w.level);
  if (!t) return false;
  t.dropMagicStoneChance = w.dropMagicStoneChance;
  wanderingHeroes.splice(idx, 1);
  territoryHeroes.push(t);
  return true;
}

export function HeroSystem_getRecruitCost(id: string): number {
  const h = wanderingHeroes.find(x => x.id === id);
  return h ? h.level * 100 : 0;
}

function spawnWanderingHero(): void {
  const typeDef = WANDERING_HERO_TYPES[Math.floor(Math.random() * WANDERING_HERO_TYPES.length)];
  wanderingHeroes.push(createWanderingHero(typeDef));
  nextWanderingSpawnIn = getRandomSpawnTime();
}

function genEnemyName(level: number): string {
  const tiers = [
    { min: 1, n: ['Goblin Scout', 'Wild Wolf', 'Forest Bandit'] },
    { min: 3, n: ['Orc Warrior', 'Cave Troll', 'Dark Mage'] },
    { min: 5, n: ['Shadow Knight', 'Dire Beast', 'Cursed Knight'] },
    { min: 8, n: ['Ancient Dragon', 'Demon Lord', 'Void Walker'] },
  ].filter(e => level >= e.min);
  const tier = tiers.pop();
  if (!tier) return 'Unknown';
  return tier.n[Math.floor(Math.random() * tier.n.length)];
}

function resolveCombat(hero: Hero) {
  const eHp = 50 + hero.level * 20;
  const eAtk = 5 + hero.level * 3;
  const eDef = 3 + hero.level * 2;
  const eName = genEnemyName(hero.level);
  const hMaxHp = hero.hp || hero.maxHp;
  const log: string[] = [];
  log.push(`⚔️ ${hero.name} encounters ${eName}!`);
  let hHp = hMaxHp;
  let eHp2 = eHp;
  for (let r = 0; r < 10 && hHp > 0 && eHp2 > 0; r++) {
    const hDmg = Math.max(1, hero.atk - eDef + Math.floor(Math.random() * 5));
    const eDmg = Math.max(1, eAtk - hero.def + Math.floor(Math.random() * 5));
    eHp2 -= hDmg;
    hHp -= eDmg;
    log.push(`【第${r + 1}回合】${hero.name} attack ${eName} for ${hDmg} dmg, enemy strikes back for ${eDmg} dmg`);
  }
  const vic = eHp2 <= 0;
  const goldR = vic ? 20 + hero.level * 10 : 0;
  const mStones = vic && Math.random() < (hero.dropMagicStoneChance ?? 0.1) ? Math.floor(Math.random() * 3) + 1 : 0;
  if (vic) {
    hero.hp = Math.max(1, hHp);
    log.push(`🏆 Victory! ${hero.name} earned ${goldR} gold${mStones > 0 ? ` and ${mStones} magic stones` : ''}!`);
  } else {
    hero.hp = Math.max(1, hHp);
    log.push(`💨 Retreat! ${hero.name} fled from ${eName}`);
  }
  return { victory: vic, goldReward: goldR, magicStones: mStones, combatLog: log };
}

export function HeroSystem_processWanderingTick(): void {
  nextWanderingSpawnIn -= 1;
  const maxW = BuildingSystem_getMaxWanderingHeroes();
  if (nextWanderingSpawnIn <= 0 && wanderingHeroes.length < maxW) spawnWanderingHero();

  for (let i = wanderingHeroes.length - 1; i >= 0; i--) {
    const hero = wanderingHeroes[i];
    if (Math.random() < 0.90) {
      const res = resolveCombat(hero);
      if (res.victory) {
        ResourceSystem_add('gold', Math.floor(res.goldReward * 0.2));
        if (res.magicStones > 0) ResourceSystem_add('magicStones', Math.floor(res.magicStones * 0.2));
      }
    }
    hero.ticksUntilStateChange = (hero.ticksUntilStateChange ?? 60) - 1;
    if (hero.ticksUntilStateChange <= 0) {
      if (Math.random() < BW.leaving) {
        wanderingHeroes.splice(i, 1);
        continue;
      }
      hero.ticksUntilStateChange = Math.floor(Math.random() * 60) + 30;
    }
  }
}

export function HeroSystem_processExplorationTick(zoneId: number): { zoneId: number; goldReward: number; materials: Record<string, number>; magicStones: number } | null {
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return null;
  const explorers = territoryHeroes.filter(h => h.status === 'exploring' && h.currentZone === zoneId);
  if (explorers.length === 0) return null;

  let expData = explorers[0].explorationProgress || 0;
  expData += 0.5 + (explorers.reduce((s, h) => s + (h.atk + h.def) / 2, 0) / 100);

  for (const hero of explorers) {
    if (Math.random() < 0.90) {
      const eHp = 30 + zone.difficulty * 25 + hero.level * 5;
      const eAtk = 3 + zone.difficulty * 4 + hero.level * 2;
      const eDef = 2 + zone.difficulty * 3 + hero.level * 2;
      let hHp = hero.hp;
      let eHp2 = eHp;
      for (let r = 0; r < 10 && hHp > 0 && eHp2 > 0; r++) {
        const hDmg = Math.max(1, hero.atk - eDef + Math.floor(Math.random() * 5));
        const eDmg = Math.max(1, eAtk - hero.def + Math.floor(Math.random() * 5));
        eHp2 -= hDmg;
        hHp -= eDmg;
      }
      const vic = eHp2 <= 0;
      if (vic) {
        const goldR = zone.difficulty * 15 + hero.level * 5;
        ResourceSystem_add('gold', goldR);
        const matD: Record<string, number> = {};
        for (const mat of zone.rewards.materials) {
          const a = Math.floor(Math.random() * 5) + 1;
          ResourceSystem_add(mat, a);
          matD[mat] = a;
        }
        let mSD = 0;
        if (Math.random() < zone.magicStoneChance) {
          mSD = Math.floor(Math.random() * 3) + 1;
          ResourceSystem_add('magicStones', mSD);
        }
        hero.hp = Math.max(1, hHp);
        return { zoneId, goldReward: goldR, materials: matD, magicStones: mSD };
      } else {
        hero.hp = Math.max(1, hHp);
        if (hero.hp <= 1) {
          hero.status = 'resting';
          hero.currentZone = null;
          hero.explorationProgress = 0;
        }
      }
    }
  }

  if (expData >= 100) {
    explorers.forEach(h => {
      h.status = 'idle';
      h.currentZone = null;
      h.explorationProgress = 0;
    });
    const gR = zone.rewards.gold.min + Math.floor(Math.random() * (zone.rewards.gold.max - zone.rewards.gold.min));
    ResourceSystem_add('gold', gR);
    const matD: Record<string, number> = {};
    for (const mat of zone.rewards.materials) {
      const a = Math.floor(Math.random() * 5) + 1;
      ResourceSystem_add(mat, a);
      matD[mat] = a;
    }
    let mSD = 0;
    if (Math.random() < zone.magicStoneChance) {
      mSD = Math.floor(Math.random() * 3) + 1;
      ResourceSystem_add('magicStones', mSD);
    }
    return { zoneId, goldReward: gR, materials: matD, magicStones: mSD };
  }

  explorers.forEach(h => {
    h.explorationProgress = expData;
  });
  return null;
}

export function HeroSystem_processRestingTick(): void {
  for (const h of territoryHeroes.filter(x => x.status === 'resting')) {
    h.hp = Math.min(h.maxHp, h.hp + Math.ceil(h.maxHp * 0.001));
    if (h.hp >= h.maxHp * 0.8) h.status = 'idle';
  }
}

export function HeroSystem_getNextWanderingSpawnIn(): number {
  return nextWanderingSpawnIn;
}

export function HeroSystem_setNextWanderingSpawnIn(v: number): void {
  nextWanderingSpawnIn = v;
}

export function HeroSystem_processWanderingOffline(cappedSeconds: number): {
  goldProduced: number;
  magicStonesProduced: number;
  heroesSpawned: number;
  heroesDeparted: number;
} {
  const result = { goldProduced: 0, magicStonesProduced: 0, heroesSpawned: 0, heroesDeparted: 0 };

  // Spawn new wandering heroes during offline time
  const spawnInterval = BuildingSystem_getWanderingSpawnInterval();
  const maxW = BuildingSystem_getMaxWanderingHeroes();
  for (let s = 0; s < Math.floor(cappedSeconds / spawnInterval) && wanderingHeroes.length < maxW; s++) {
    const typeDef = WANDERING_HERO_TYPES[Math.floor(Math.random() * WANDERING_HERO_TYPES.length)];
    wanderingHeroes.push(createWanderingHero(typeDef));
    result.heroesSpawned++;
  }

  // Simulate combat for each wandering hero (expected-value batch)
  for (let i = wanderingHeroes.length - 1; i >= 0; i--) {
    const hero = wanderingHeroes[i];
    const combatRounds = Math.floor(cappedSeconds * 0.9); // 90% combat chance per tick
    const winRate = 0.7; // heroes generally win vs same-level enemies
    const victories = Math.max(0, Math.floor(combatRounds * winRate));

    if (victories > 0) {
      const goldPerWin = 20 + hero.level * 10;
      const kingdomGold = Math.floor(victories * goldPerWin * 0.2);
      ResourceSystem_add('gold', kingdomGold);
      result.goldProduced += kingdomGold;

      const msChance = hero.dropMagicStoneChance ?? 0.1;
      if (Math.random() < 1 - Math.pow(1 - msChance, victories)) {
        const stones = Math.floor(Math.random() * 3) + 1;
        ResourceSystem_add('magicStones', stones);
        result.magicStonesProduced += stones;
      }
    }

    // Determine if hero departs during offline time
    // Expected lifetime: ~750 ticks (10 state-change cycles × avg 75 ticks/cycle)
    if (cappedSeconds > 120) {
      const survivalChance = Math.pow(1 - 1 / 750, cappedSeconds);
      if (Math.random() > survivalChance) {
        wanderingHeroes.splice(i, 1);
        result.heroesDeparted++;
      }
    }
  }

  return result;
}

export function HeroSystem_addListener(cb: (event: { type: string; hero?: Hero; data?: unknown }) => void): void {
  heroListeners.push(cb);
}