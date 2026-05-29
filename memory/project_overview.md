---
name: project-overview
description: 專案概述：基於 PixiJS 的瀏覽器閒置王國建設遊戲
metadata:
  type: project
---

# Project Overview — mega-idle-pixi

**王國傳說** — 一款基於 PixiJS 的瀏覽器閒置王國建設遊戲（Idle Kingdom Builder）。

## 技術棧

| 層 | 技術 |
|---|------|
| 渲染 | PixiJS v8 (Canvas 2D/WebGL) |
| UI | PixiJS Container + Text + Graphics (無 DOM UI) |
| 建構 | Vite + TypeScript |
| 存檔 | localStorage (JSON) |
| CI/CD | GitHub Actions → GitHub Pages |

## 專案結構

```
mega-idle-pixi/
├── index.html               # 單一 entry point
├── src/
│   ├── main.ts              # 初始化、遊戲主迴圈
│   ├── PixiApp.ts           # PixiJS Application factory
│   ├── data/
│   │   └── gameData.ts      # 所有靜態資料定義（資源/建築/英雄/物品/地圖）
│   ├── systems/
│   │   ├── ResourceSystem.ts    # 資源 CRUD + 每秒產出
│   │   ├── BuildingSystem.ts    # 建築升級、成本計算
│   │   ├── HeroSystem.ts        # 領土英雄 + 漫遊英雄 AI + 戰鬥
│   │   ├── ShopSystem.ts        # 商店製作/庫存
│   │   ├── MapSystem.ts         # 地圖解鎖/探索
│   │   ├── SaveManager.ts       # localStorage 存讀
│   │   └── OfflineSystem.ts     # 8小時離線計算
│   └── rendering/
│       └── panels/
│           ├── ResourcePanel.ts # 資源面板（含進度條）
│           ├── HeroPanel.ts     # 英雄面板（領土/流浪 tab）
│           ├── BuildingPanel.ts # 建築升級面板
│           ├── MapPanel.ts      # 地圖探索面板
│           └── ShopPanel.ts     # 工坊商店面板
├── dist/                     # 建構輸出
├── vite.config.ts
└── tsconfig.json
```

## 相關記憶

- [[dev-progress]] — 開發進度
