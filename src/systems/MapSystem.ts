import { ZONES, type GameState } from '../data/gameData';
import { HeroSystem_getTerritoryHeroes } from './HeroSystem';

// ═══════════════════════════════════════════════════════════════
// MAP SYSTEM
// ═══════════════════════════════════════════════════════════════

interface MapProgress {
  currentZone: number;
  unlockedZones: number[];
  clearedZones: number[];
}

interface ActiveExploration {
  heroId: string;
  zoneId: number;
  progress: number;
  startTime: number;
  zoneName: string;
}

let mapProgress: MapProgress = { currentZone: 1, unlockedZones: [1], clearedZones: [] };
let activeExplorations: ActiveExploration[] = [];
let mapListeners: Array<(event: { type: string; data?: unknown }) => void> = [];

export function MapSystem_init(savedState?: GameState): void {
  mapProgress = savedState?.mapProgress || { currentZone: 1, unlockedZones: [1], clearedZones: [] };
  activeExplorations = [];
}

export function MapSystem_getZones() {
  return [...ZONES];
}

export function MapSystem_getProgress(): MapProgress {
  return { currentZone: mapProgress.currentZone, unlockedZones: [...mapProgress.unlockedZones], clearedZones: [...mapProgress.clearedZones] };
}

export function MapSystem_getUnlockedZones() {
  return mapProgress.unlockedZones.map(id => ZONES.find(z => z.id === id)).filter(Boolean);
}

export function MapSystem_isZoneUnlocked(id: number): boolean {
  return mapProgress.unlockedZones.includes(id);
}

export function MapSystem_isZoneCleared(id: number): boolean {
  return mapProgress.clearedZones.includes(id);
}

export function MapSystem_startExploration(heroId: string, zoneId: number): boolean {
  const heroes = HeroSystem_getTerritoryHeroes();
  const hero = heroes.find(h => h.id === heroId);
  if (!hero || hero.status !== 'idle') return false;
  if (!MapSystem_isZoneUnlocked(zoneId)) return false;

  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return false;

  hero.status = 'exploring';
  hero.currentZone = zoneId;
  hero.explorationProgress = 0;

  activeExplorations.push({ heroId, zoneId, progress: 0, startTime: Date.now(), zoneName: zone.name });
  return true;
}

export function MapSystem_processExplorations(): ActiveExploration[] {
  const completed: ActiveExploration[] = [];

  for (let i = activeExplorations.length - 1; i >= 0; i--) {
    const exp = activeExplorations[i];
    const heroes = HeroSystem_getTerritoryHeroes();
    const hero = heroes.find(h => h.id === exp.heroId);

    if (!hero || hero.status !== 'exploring') {
      activeExplorations.splice(i, 1);
      continue;
    }

    const zone = ZONES.find(z => z.id === exp.zoneId);
    if (!zone) {
      activeExplorations.splice(i, 1);
      continue;
    }

    // Exploration progresses based on hero stats
    exp.progress = hero.explorationProgress || 0;

    if (exp.progress >= 100) {
      activeExplorations.splice(i, 1);
      if (!MapSystem_isZoneCleared(zone.id)) {
        mapProgress.clearedZones.push(zone.id);
      }
      const nextZ = ZONES.find(z => z.id === zone.id + 1);
      if (nextZ && !MapSystem_isZoneUnlocked(nextZ.id)) {
        mapProgress.unlockedZones.push(nextZ.id);
        mapProgress.currentZone = nextZ.id;
      }
      completed.push({ ...exp, progress: 100 });
    }
  }

  return completed;
}

export function MapSystem_completeZone(zoneId: number): void {
  if (!mapProgress.clearedZones.includes(zoneId)) {
    mapProgress.clearedZones.push(zoneId);
  }
  const nextZ = ZONES.find(z => z.id === zoneId + 1);
  if (nextZ && !mapProgress.unlockedZones.includes(nextZ.id)) {
    mapProgress.unlockedZones.push(nextZ.id);
    mapProgress.currentZone = nextZ.id;
  }
}

export function MapSystem_addListener(cb: (event: { type: string; data?: unknown }) => void): void {
  mapListeners.push(cb);
}

export function MapSystem_getActiveExplorations(): ActiveExploration[] {
  return [...activeExplorations];
}