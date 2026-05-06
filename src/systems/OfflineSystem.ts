import { MATERIAL_TYPES, type GameState } from '../data/gameData';
import { ResourceSystem_add } from './ResourceSystem';

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

  const matP: Record<string, number> = {};
  for (const mat of MATERIAL_TYPES) {
    const v = 0.8 + Math.random() * 0.4;
    const p = Math.floor(2 * capped * v * OFFLINE_EFF);
    matP[mat] = p;
    ResourceSystem_add(mat, p);
  }

  const gP = Math.floor(50 * (capped / 60) * OFFLINE_EFF);
  ResourceSystem_add('gold', gP);

  const mS = Math.floor(Math.random() * 3);
  if (mS > 0) ResourceSystem_add('magicStones', mS);

  return {
    totalSeconds: total,
    cappedSeconds: capped,
    isCapped: total > MAX_OFFLINE,
    materialsProduced: matP,
    goldProduced: gP,
    magicStonesProduced: mS,
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