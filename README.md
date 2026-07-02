# AI High School · UX Prototype Preview（Prototype v0.1）

Task **P001_Prototype_Preview** — 整合目前 Home，可直接預覽的 UX Prototype。

## 執行方式
**雙擊 `index.html`** 即可執行。無需 Node.js、npm、Live Server 或任何伺服器；
無網路請求、無建置工具。

## 整合內容（目前 Home，由上而下）
1. Home Hero（AI 巧巧老師、問候、今日建議、開始／繼續學習）
2. Today Mission（今日教材／今日考卷／今日完成率）
3. Resume Learning（最近科目／章節／學習進度／繼續學習）
4. Recent Materials（最近教材卡，可點擊）
5. Bottom Navigation（首頁／教材／考卷／錯題本／我的，Active 可切換）

所有互動皆為 Mock 事件；全部使用 Mock Data；未新增任何功能。

## 已驗證裝置（RWD）
- iPhone Safari（直向；卡片單欄、按鈕滿版、底部導覽固定）
- Android Chrome（同上）
- iPad（置中、最大寬度 720px 版心）
- Desktop（置中版心、最近教材兩欄 grid）

無橫向捲動、元件無重疊、內容不超出畫面。

## 技術
- 純 HTML5（Semantic）／CSS3（BEM）／ES5+ JavaScript（camelCase）；元件 PascalCase。
- 共用 window.AHS，依序 <script> 載入；無框架、無 ES modules、無建置。

## 檔案
index.html
assets/     favicon.svg
css/        tokens.css, hero.css, today.css, resume.css, recent-materials.css, bottom-nav.css
js/         ui.js, mock-data.js, HeroCard.js, app.js
components/ TodayMission.js, ResumeLearning.js, HomeRecentMaterials.js, HomeBottomNavigation.js
