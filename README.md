# AI High School Learning System — Prototype

高中生 AI 學習平台原型。純 HTML5 / CSS3 / Vanilla JavaScript，全部 Mock Data，
無後端 / 無 API / 無 build 工具，相容 file:// 與 GitHub Pages。

## 目前進度

- [x] 巧巧老師 SVG 素材庫（表情 10 款 + 姿勢 6 款）
- [x] 首頁 Home v1.0（App Shell + Hero + 今日任務 + 最近教材 + AI 巧巧老師 + 學習統計 + 學習計畫 + 成就徽章）
- [ ] 教材中心 / 測驗中心 / 錯題本 / 總結中心 / 我的學習 / 儀表板 / AI Tutor

## 目錄結構

```
index.html                     首頁（進入點）
qiaoqiao-gallery.html          巧巧老師素材庫（QA 用，不連結至產品導覽）
css/
  tokens.css                   設計 token（紫色系 + 九科色票）
  shell.css                    App Shell（頂欄 / 側邊欄 / 底部導覽）
  home.css                     首頁版面 + 共用元件（card / chip / progressbar）
  qiaoqiao.css                 巧巧老師素材尺寸工具
  qiaoqiao-gallery.css         素材庫頁面版面
js/
  ui.js                        DOM helper（AHS.UI）
  Icons.js                     共用 inline SVG 圖示 + 九科 metadata
  mock-data.js                 全站 Mock Data（AHS.Mock）
  Qiaoqiao.js                  巧巧老師素材庫（AHS.Qiaoqiao.bust / .full）
  HeroCard.js                  首頁 Hero
  app.js                       首頁啟動
components/
  AppShell.js                  共用外框
  TodayMission.js              今日任務
  HomeRecentMaterials.js       最近教材
  AiTutorHomeCard.js           AI 巧巧老師卡
  StudyStats.js                學習統計
  StudyPlan.js                 學習計畫
  AchievementBadges.js         成就徽章
  QiaoqiaoGallery.js           素材庫頁面（QA）
assets/
  favicon.svg
```

## 技術約束

- 不使用 React / Vue / Node / npm / server / build tools
- 所有 JS 共用 `window.AHS` 命名空間，以順序 `<script>` 載入
- CSS 採 BEM 命名；JS 採 camelCase；元件採 PascalCase
- Console Error = 0；html5validator EXIT 0
