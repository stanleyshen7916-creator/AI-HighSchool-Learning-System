/* js/data/tasks.js — Sprint 1 · Task 005: 今日任務 Mock Data.
   Pure data holder under window.AHS.Data. No fetch/XHR — static mock only. */
window.AHS = window.AHS || {};
AHS.Data = AHS.Data || {};

AHS.Data.tasks = [
  { id: 1, subject: "數學", title: "第三章 指數函數", progress: 40, status: "in_progress" },
  { id: 2, subject: "英文", title: "Unit 4 文法練習", progress: 70, status: "in_progress" },
  { id: 3, subject: "物理", title: "牛頓運動定律總整理", progress: 100, status: "done" },
  { id: 4, subject: "化學", title: "化學反應與平衡", progress: 0, status: "not_started" }
];
