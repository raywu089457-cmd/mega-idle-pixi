---
name: dev-progress
description: 開發進度追蹤 — 截至 2026-05-30
metadata:
  type: project
---

# Development Progress — mega-idle-pixi

> 最後更新: 2026-05-30 (修復探索區域完成後 `mapProgress` 未更新 — `HeroSystem_processExplorationTick` 加 `MapSystem_completeZone`)

## 總覽

專案從最初的 `mega-idle-web`（vanilla HTML/JS 設計規格）移植/重構成 `mega-idle-pixi`（PixiJS + TypeScript + Vite）。完整的核心遊戲系統已就緒並可執行。

## 完成度

### ✅ 已完成 — 核心系統 (100%)

| 系統 | 檔案 | 狀態 |
|------|------|------|
| 資源系統 | `ResourceSystem.ts` (109行) | ✅ 完整，含 CRUD、容量管理、監聽事件 |
| 建築系統 | `BuildingSystem.ts` (81行) | ✅ 完整，5種建築、升級、成本計算 |
| 英雄系統 | `HeroSystem.ts` (310行) | ✅ 完整，含離線戰鬥模擬 `processWanderingOffline` |
| 地圖系統 | `MapSystem.ts` (122行) | ✅ 完整，5區探索、解鎖連鎖、離線區域完成 |
| 商店系統 | `ShopSystem.ts` (49行) | ✅ 完整，5種物品製作、自動生產 |
| 離線系統 | `OfflineSystem.ts` (228行) | ✅ 完整，8小時離線推估、英雄探索/戰鬥/休息模擬、初始載入處理 |
| 存檔系統 | `SaveManager.ts` (53行) | ✅ 完整，localStorage 每30秒自動存 |
| 遊戲資料 | `gameData.ts` (203行) | ✅ 完整，所有靜態定義 |

### ✅ 已完成 — UI 面板 (100%)

| 面板 | 檔案 | 狀態 |
|------|------|------|
| 資源面板 | `ResourcePanel.ts` (153行) | ✅ 完整，進度條、容量顯示 |
| 英雄面板 | `HeroPanel.ts` (298行) | ✅ 完整，領土/流浪 tab、訓練/招募/出征 |
| 建築面板 | `BuildingPanel.ts` (150行) | ✅ 完整，升級按鈕、成本顯示 |
| 地圖面板 | `MapPanel.ts` (143行) | ✅ 完整，區域選擇、狀態顯示 |
| 商店面板 | `ShopPanel.ts` (174行) | ✅ 完整，製作按鈕、庫存顯示 |

### ✅ 已完成 — 遊戲主體 (100%)

| 元件 | 檔案 | 狀態 |
|------|------|------|
| 主遊戲迴圈 | `main.ts` (522行) | ✅ 完整，每秒 tick、30秒存檔、初始離線處理 |
| PixiJS 應用 | `PixiApp.ts` (32行) | ✅ 完整 |
| 城堡動畫 | `main.ts` (CastleScene) | ✅ 浮動動畫 + 點擊回饋 |
| 浮動數字 | `main.ts` (FloatNumberRenderer) | ✅ 飄出效果 |
| HUD | `main.ts` (HUD) | ✅ 資源顯示 |
| 底部導航 | `main.ts` (BottomNav) | ✅ 5個面板切換 |

### ✅ 已完成 — 基礎建設

| 項目 | 狀態 |
|------|------|
| Vite 建構 | ✅ 可建構 |
| TypeScript strict 模式 | ✅ 已修正 |
| GitHub Actions (deploy.yml) | ✅ 部署到 Pages |
| .gitignore | ✅ |

### ✅ 已修復的 Bugs

| 問題 | 修復 |
|------|------|
| **重開網頁英雄卡住（root cause）** | `HeroSystem_processExplorationTick()` 完成區域後只設英雄 idle，從未更新 `mapProgress`。依賴的 `MapSystem_processExplorations()` 需要 `activeExplorations`，但該陣列在 `MapSystem_init()` 被清空。修復：`processExplorationTick` 在 `expData >= 100` 時直接呼叫 `MapSystem_completeZone()` |
| **離線區域未標記完成** | 新增 `MapSystem_completeZone()` 在離線模擬中呼叫，區域完成後標記為已清除、解鎖下一個區域 |
| **離線探索缺少每 tick 戰鬥獎勵** | `simulateOfflineHeroes` 新增每 tick 戰鬥勝場估算（金幣/材料/魔法石）|
| **初始頁面載入未處理離線時間** | 新增 `OfflineSystem_processInitialOffline()` 在 `init()` 中呼叫，離線時間的探索進度/戰鬥傷害/獎勵全部正確套用 |

### ❌ 未實作 / 已知問題

| 項目 | 說明 |
|------|------|
| **PWA support** | manifest.json 與 sw.js 尚未建立 |
| **IndexedDB 存檔** | 目前使用 localStorage，規格預計用 IndexedDB |
| **Canvas 動畫區** | 規格預計有 Canvas 遊戲區域顯示英雄移動等，目前僅有靜態城堡 |
| **響應式/手機優化** | 固定 480px 寬度，未針對手機螢幕做觸控優化 |
| **音效** | 未實作 |
| **英雄自動派遣** | 目前需手動點出征按鈕 |
| **魔法石系統** | 已定義但選取/使用 UI 不完整 |
| **E2E 測試** | Playwright 已安裝但無測試案例 |
| **招募動畫** | 無動畫回饋 |

## Git History

```
30d43af fix: update deprecated GitHub Actions to latest versions
ea7e230 feat: complete PixiJS idle game systems integration
385d6c9 fix: TypeScript strict mode errors (v2)
6c45f29 feat: initial PixiJS idle game setup
```

## 設計規格參考

原始設計規格: `docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md`
專案 CLAUDE.md: `CLAUDE.md` (指向 `mega-idle-web` 結構 — 待更新?)

## 下一步可能的方向

1. **PWA** — 建立 manifest.json 與 sw.js
2. **IndexedDB** — 取代 localStorage 以支援更大容量
3. **視覺升級** — Canvas 動畫區（英雄漫步、戰鬥特效）
4. **手機適配** — 觸控 UI、螢幕縮放
5. **遊戲平衡** — 調整數值與升級曲線
6. **更多內容** — 更多英雄職業、地圖區域、物品配方
