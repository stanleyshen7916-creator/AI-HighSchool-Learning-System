/* js/utils/task.js — Sprint 1 · Task 005: 今日任務（Today's Mission）.
   Pure Vanilla JS utility under window.AHS.Utils. Reads AHS.Data.tasks and
   returns the task array (never throws — returns an empty array on
   missing/invalid data, so the caller can render the empty-state message
   "今天沒有安排學習任務" without any Console Error). */
window.AHS = window.AHS || {};
AHS.Utils = AHS.Utils || {};

/* getTodayTasks()
   回傳 AHS.Data.tasks（Array）。
   若資料不存在或格式無效，回傳空陣列 []。 */
AHS.Utils.getTodayTasks = function () {
  try {
    var tasks = AHS.Data && AHS.Data.tasks;

    if (!tasks || !tasks.length) {
      return [];
    }

    return tasks;
  } catch (err) {
    return [];
  }
};
