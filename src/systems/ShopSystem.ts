import { ITEMS, type GameState } from '../data/gameData';
import { ResourceSystem_canAfford, ResourceSystem_spend } from './ResourceSystem';

// ═══════════════════════════════════════════════════════════════
// SHOP SYSTEM
// ═══════════════════════════════════════════════════════════════

let shopInventory: Record<string, number> = {};
let shopListeners: Array<(event: { type: string; item?: string; data?: unknown }) => void> = [];
const MAX_INV = 100;

export function ShopSystem_init(savedState?: GameState): void {
  shopInventory = { ...(savedState?.shopInventory || {}) };
}

export function ShopSystem_getItems() {
  return Object.values(ITEMS);
}

export function ShopSystem_getItem(id: string) {
  return ITEMS[id] || null;
}

export function ShopSystem_craftItem(id: string): boolean {
  const item = ITEMS[id];
  if (!item) return false;
  if (!ResourceSystem_canAfford(item.cost)) return false;
  if ((shopInventory[id] || 0) >= MAX_INV) return false;
  if (!ResourceSystem_spend(item.cost)) return false;
  shopInventory[id] = (shopInventory[id] || 0) + 1;
  return true;
}

export function ShopSystem_getInventory(): Record<string, number> {
  return { ...shopInventory };
}

export function ShopSystem_processAutoProduction(): string | null {
  if (Math.random() > 0.05) return null;
  const affordable = Object.values(ITEMS).filter(item => ResourceSystem_canAfford(item.cost));
  if (affordable.length === 0) return null;
  const item = affordable[Math.floor(Math.random() * affordable.length)];
  if (!ResourceSystem_spend(item.cost)) return null;
  shopInventory[item.id] = (shopInventory[item.id] || 0) + 1;
  return item.id;
}

export function ShopSystem_addListener(cb: (event: { type: string; item?: string; data?: unknown }) => void): void {
  shopListeners.push(cb);
}