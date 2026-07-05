# AI High School Learning System — Prototype v0.1

高中生 AI 學習平台原型。純 HTML5 / CSS3 / Vanilla JavaScript，全部 Mock Data，
無後端 / 無 API / 無 build 工具，相容 file:// 與 GitHub Pages。

## 進度：全部頁面完成 ✔

- [x] 巧巧老師 SVG 素材庫（表情 10 款 + 姿勢 6 款）
- [x] 首頁 Home
- [x] 教材中心 Material Center
- [x] 測驗中心 Quiz Center
- [x] 錯題本 Wrong Book
- [x] 總結中心 / 學習總結 Summary Center
- [x] 我的學習 My Learning
- [x] AI Tutor（巧巧老師對話）

## 頁面

| 檔案 | 說明 |
|------|------|
| `index.html` | 首頁 Home（七大區塊） |
| `materials.html` | 教材中心 Material Center |
| `quiz.html` | 測驗中心 Quiz Center（含純 SVG 甜甜圈圖） |
| `wrongbook.html` | 錯題本 Wrong Book（左列表 + 右題目詳解，主從式） |
| `summary.html` | 總結中心 / 學習總結（AI 總結 + 思維導圖 + 知識樹） |
| `learning.html` | 我的學習（總覽 + 長條圖 + 雷達圖 + 學習日曆 + 徽章） |
| `tutor.html` | AI Tutor（巧巧老師對話，Mock 回覆） |
| `qiaoqiao-gallery.html` | 巧巧老師素材庫（QA 用，不連結至產品導覽） |

側邊欄與底部導覽支援分頁跳轉：七個產品頁皆為真連結，可互相切換。

## 目錄結構

```
index.html / materials.html / quiz.html / wrongbook.html /
summary.html / learning.html / tutor.html / qiaoqiao-gallery.html
css/
  tokens.css        設計 token（紫色系 + 九科色票 + 共用變數）
  shell.css         App Shell（頂欄 / 側邊欄 / 底部導覽）
  home.css          首頁 + 共用元件（card / chip / progressbar）
  material.css / quiz.css / wrongbook.css / summary.css /
  learning.css / tutor.css                各頁版面
  qiaoqiao.css / qiaoqiao-gallery.css     巧巧老師素材尺寸與素材庫
js/
  ui.js             DOM helper（AHS.UI）
  Icons.js          共用 inline SVG 圖示 + 九科 metadata（AHS.Icons / AHS.Subjects）
  mock-data.js      全站 Mock Data（AHS.Mock）
  Qiaoqiao.js       巧巧老師素材庫（AHS.Qiaoqiao：bust ×10、full ×6）
  HeroCard.js       首頁 Hero
  app.js / app-materials.js / app-quiz.js / app-wrongbook.js /
  app-summary.js / app-learning.js / app-tutor.js   各頁啟動
components/
  AppShell.js       共用外框（頂欄 / 側邊欄 / 底部導覽 + 分頁路由）
  TodayMission.js / HomeRecentMaterials.js / AiTutorHomeCard.js /
  StudyStats.js / StudyPlan.js / AchievementBadges.js   首頁區塊
  MaterialCenter.js / QuizCenter.js / WrongBook.js /
  SummaryCenter.js / MyLearning.js / AiTutor.js         各頁主元件
  QiaoqiaoGallery.js 素材庫頁面（QA）
assets/favicon.svg
```

## 技術約束

- 不使用 React / Vue / Angular / Node.js / Docker / build tools
- 不串接 OpenAI / Gemini / 後端 / 資料庫；全站 Mock Data
- 所有 JS 共用 `window.AHS` 命名空間，以順序 `<script>` 載入（無 modules）
- HTML 語意化；CSS 採 BEM；JS 採 camelCase；元件採 PascalCase
- 設計風格：Apple + Notion + Duolingo（大量留白、卡片式、一致性、RWD）

## 品質狀態（全頁面）

- html5validator（vnu）：EXIT 0
- jsdom 行為測試：Console Error = 0（8 頁全數通過）
- 禁用樣式掃描：無 fetch / XHR / import / export / inline handler /
  localStorage / AI API；CSS 無 var()-in-gradient、calc(var+var)、dvh、
  inset:、env() 等 vnu 禁用樣式
- 無 Dead Code / 未使用 CSS / 未使用 JS

## 部署

GitHub Pages（`.nojekyll` + Actions 就緒）。開發者手動 push，前端不具 write 權限。
