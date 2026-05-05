import { RESOURCES, MATERIAL_TYPES, type GameState } from '../data/gameData';

// ═══════════════════════════════════════════════════════════════
// RESOURCE SYSTEM
// ═══════════════════════════════════════════════════════════════

interface ResourceState {
  value: number;
  capacity: number;
}

let resources: Record<string, ResourceState> = {};
let resourceListeners: Array<(event: { type: string; resourceId: string; amount: number; total: number }) => void> = [];

export function ResourceSystem_init(savedState?: GameState): void {
  if (savedState?.resources) {
    resources = {};
    for (const [key, config] of Object.entries(RESOURCES)) {
      resources[key] = {
        value: (savedState.resources as Record<string, number>)[key] ?? config.initial,
        capacity: config.capacity,
      };
    }
  } else {
    resources = {};
    for (const [key, config] of Object.entries(RESOURCES)) {
      resources[key] = { value: config.initial, capacity: config.capacity };
    }
  }
}

export function ResourceSystem_add(resourceId: string, amount: number): number {
  if (!resources[resourceId]) return 0;
  const prev = resources[resourceId].value;
  const newValue = Math.min(prev + amount, RESOURCES[resourceId].capacity);
  const actualAdded = newValue - prev;
  resources[resourceId].value = newValue;
  resourceListeners.forEach(l => {
    try {
      l({ type: 'add', resourceId, amount: actualAdded, total: newValue });
    } catch (_e) {
      // ignore
    }
  });
  return actualAdded;
}

export function ResourceSystem_subtract(resourceId: string, amount: number): boolean {
  if (!resources[resourceId]) return false;
  const prev = resources[resourceId].value;
  if (prev < amount) return false;
  resources[resourceId].value = prev - amount;
  resourceListeners.forEach(l => {
    try {
      l({ type: 'subtract', resourceId, amount, total: resources[resourceId].value });
    } catch (_e) {
      // ignore
    }
  });
  return true;
}

export function ResourceSystem_get(resourceId: string): number {
  return resources[resourceId]?.value ?? 0;
}

export function ResourceSystem_getAll(): Record<string, number> {
  const r: Record<string, number> = {};
  for (const [k, v] of Object.entries(resources)) r[k] = v.value;
  return r;
}

export function ResourceSystem_canAfford(cost: Record<string, number>): boolean {
  for (const [id, amt] of Object.entries(cost)) {
    if (ResourceSystem_get(id) < amt) return false;
  }
  return true;
}

export function ResourceSystem_spend(cost: Record<string, number>): boolean {
  if (!ResourceSystem_canAfford(cost)) return false;
  for (const [id, amt] of Object.entries(cost)) ResourceSystem_subtract(id, amt);
  return true;
}

export function ResourceSystem_getCapacity(resourceId: string): number {
  return resources[resourceId]?.capacity ?? 0;
}

export function ResourceSystem_getFillPercent(resourceId: string): number {
  const s = resources[resourceId];
  if (!s || s.capacity === 0) return 0;
  return (s.value / s.capacity) * 100;
}

export function ResourceSystem_produceMaterials(monumentLevel = 1): Record<string, number> {
  const results: Record<string, number> = {};
  for (const mat of MATERIAL_TYPES) {
    results[mat] = ResourceSystem_add(mat, (Math.floor(Math.random() * 3) + 1) * monumentLevel);
  }
  return results;
}

export function ResourceSystem_addListener(cb: (event: { type: string; resourceId: string; amount: number; total: number }) => void): void {
  resourceListeners.push(cb);
}

export function ResourceSystem_getConfig(rid: string) {
  return RESOURCES[rid] ?? null;
}