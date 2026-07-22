/* js/utils/countdown.js — Sprint 1 · Task 003: 下一次段考倒數.
   Pure Vanilla JS utility under window.AHS.Utils. Reads AHS.Data.exam and
   returns { examName, remainingDays }. Never throws — returns null when
   exam data is missing/invalid, so the caller can render the fallback
   message ("尚未設定段考資訊") without any Console Error. */
window.AHS = window.AHS || {};
AHS.Utils = AHS.Utils || {};

/* getExamCountdown()
   remainingDays = examDate - 今天（以「日」為單位，忽略時分秒）。
   最低為 0，不得出現負數。
   若 AHS.Data.exam 不存在或格式無效，回傳 null。 */
AHS.Utils.getExamCountdown = function () {
  try {
    var exam = AHS.Data && AHS.Data.exam;

    if (!exam || !exam.examName || !exam.examDate) {
      return null;
    }

    var examDate = new Date(exam.examDate + "T00:00:00");
    if (isNaN(examDate.getTime())) {
      return null;
    }

    var today = new Date();
    var todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var examMidnight = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

    var msPerDay = 1000 * 60 * 60 * 24;
    var diffDays = Math.round((examMidnight.getTime() - todayMidnight.getTime()) / msPerDay);

    return {
      examName: exam.examName,
      remainingDays: diffDays < 0 ? 0 : diffDays
    };
  } catch (err) {
    return null;
  }
};
