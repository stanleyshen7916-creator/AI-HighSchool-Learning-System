/* components/MyLearning.js — 我的學習 (My Learning) page.

   Sprint 6.6 Runtime QA Final Bug Fix (WO-015/WO-016, Issue #026/#027):
   Learning Center Runtime Integration. Reads AHS.MaterialRuntime
   (learningTime/lastLearningAt/progress — existing fields, untouched
   Schema) and AHS.HistoryRuntime (existing quiz-history records) for
   everything that has a genuine real data source. Where NO Runtime
   anywhere in this repository tracks the underlying concept (streak-
   day gamification badges, a "today's planned focus" list), this file
   shows an honest Empty State / Coming Soon rather than Mock content —
   never fabricates numbers. All previously-dead links/buttons now
   satisfy one of: ① real Runtime-backed action, ② disabled with a
   reason, ③ Coming Soon.
   Radar chart and calendar are pure inline SVG / CSS (no chart library).
   PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.MyLearning = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  function materials() {
    return (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
  }
  function history() {
    return (AHS.HistoryRuntime && typeof AHS.HistoryRuntime.list === "function")
      ? AHS.HistoryRuntime.list() : [];
  }
  function startOfWeek(d) {
    var s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // Monday start
    return s;
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* ---- Overview ---------------------------------------------------------
     Real, computable equivalents only. No streak/gamified numbers are
     invented — 累積學習天數 is a real count of distinct calendar dates
     with any recorded learning activity; 完成題數/正確率 come from the
     existing AHS.HistoryRuntime (quiz results), never fabricated. */
  function computeOverviewStats() {
    var mats = materials();
    var distinctDays = {};
    var totalMinutes = 0;
    mats.forEach(function (m) {
      if (m.lastLearningAt) {
        var d = new Date(m.lastLearningAt);
        distinctDays[d.toDateString()] = true;
      }
      if (typeof m.learningTime === "number") { totalMinutes += m.learningTime; }
    });

    var hist = history();
    var totalQuestions = 0, totalCorrect = 0;
    hist.forEach(function (h) {
      totalQuestions += (typeof h.totalCount === "number" ? h.totalCount : 0);
      totalCorrect += (typeof h.correctCount === "number" ? h.correctCount : 0);
    });
    var accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;

    return {
      title: "學習總覽",
      speech: mats.length ? "持續累積，你的努力都算數！" : "上傳第一份教材，開始累積你的學習紀錄吧！",
      stats: [
        { icon: "calendar", label: "累積學習天數", value: String(Object.keys(distinctDays).length), unit: "天", delta: "", tone: "ok" },
        { icon: "check", label: "完成題數", value: String(totalQuestions), unit: "題", delta: "", tone: "ok" },
        { icon: "target", label: "正確率", value: String(accuracy), unit: "%", delta: "", tone: "ok" }
      ]
    };
  }

  function overview() {
    var ov = computeOverviewStats();
    var stats = el("div", { class: "ml-overview__stats" },
      ov.stats.map(function (s) {
        return el("div", { class: "ml-overview__stat" }, [
          el("span", { class: "ml-overview__stat-icon", html: AHS.Icons[s.icon]() }),
          el("span", { class: "ml-overview__stat-label", text: s.label }),
          el("strong", { class: "ml-overview__stat-value" }, [
            el("span", { text: s.value }),
            el("small", { text: " " + s.unit })
          ])
        ]);
      }));

    return el("section", { class: "card ml-overview", "aria-label": ov.title }, [
      el("div", { class: "ml-overview__main" }, [
        el("h2", { class: "card__title", text: ov.title }),
        stats
      ]),
      el("div", { class: "ml-overview__aside" }, [
        el("div", {
          class: "ml-overview__avatar qiaoqiao-bust qiaoqiao-bust--lg",
          html: AHS.Qiaoqiao.bust("cheer")
        }),
        el("p", { class: "ml-overview__speech", text: ov.speech })
      ])
    ]);
  }

  /* ---- Learning record: bar chart + today focus -------------------------
     本週 bars are real (aggregated AHS.MaterialRuntime.learningTime by
     day, for the real current calendar week). 本月/今年/全部 stay
     Disabled + Coming Soon — no historical-by-period Runtime exists
     anywhere in this repo (unchanged from Sprint 6.6 Round 1/WO-005;
     building one is a new feature, out of scope for a Bug Fix). */
  function computeWeekBars() {
    var monday = startOfWeek(new Date());
    var weekdayLabels = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    var minutesByDate = {};
    materials().forEach(function (m) {
      if (!m.lastLearningAt) { return; }
      var d = new Date(m.lastLearningAt);
      if (d >= monday && d < new Date(monday.getTime() + 7 * 86400000)) {
        var key = d.toDateString();
        minutesByDate[key] = (minutesByDate[key] || 0) + (typeof m.learningTime === "number" ? m.learningTime : 0);
      }
    });
    var bars = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday.getTime() + i * 86400000);
      var minutes = minutesByDate[d.toDateString()] || 0;
      bars.push({
        label: (d.getMonth() + 1) + "/" + d.getDate(),
        sub: weekdayLabels[i],
        hours: Math.round((minutes / 60) * 10) / 10
      });
    }
    return bars;
  }

  function recordTabs(container) {
    var TAB_LABELS = ["本週", "本月", "今年", "全部"];
    return el("div", { class: "ml-tabs" },
      TAB_LABELS.map(function (t, i) {
        var isWeek = (i === 0);
        var b = el("button", {
          type: "button",
          class: "ml-tab" + (isWeek ? " is-active" : " is-disabled"),
          disabled: isWeek ? null : "disabled"
        }, [
          el("span", { text: t }),
          isWeek ? null : el("span", { class: "ml-tab__soon", text: "Coming Soon" })
        ]);
        if (isWeek) {
          b.addEventListener("click", function () {
            Array.prototype.forEach.call(container.children, function (c) { c.classList.remove("is-active"); });
            b.classList.add("is-active");
          });
        }
        return b;
      }));
  }

  function record() {
    var bars = computeWeekBars();
    var hasAnyMaterial = materials().length > 0;
    var tabsWrap = el("div", { class: "ml-tabs-slot" });
    var tabs = recordTabs(tabsWrap);
    tabsWrap.appendChild(tabs);

    var body;
    if (!hasAnyMaterial) {
      body = el("p", { class: "ml-record__empty", text: "尚無學習紀錄，上傳教材並開始學習後即會顯示本週時數。" });
    } else {
      var max = bars.reduce(function (m, b) { return Math.max(m, b.hours); }, 0) || 1;
      body = el("div", { class: "ml-bars" },
        bars.map(function (b) {
          var h = Math.round((b.hours / max) * 100);
          return el("div", { class: "ml-bars__col" }, [
            el("span", { class: "ml-bars__val", text: String(b.hours) }),
            el("div", { class: "ml-bars__track" }, [
              el("div", { class: "ml-bars__fill", style: "height:" + h + "%",
                role: "img", "aria-label": b.label + " " + b.hours + " 小時" })
            ]),
            el("span", { class: "ml-bars__label", text: b.label }),
            el("span", { class: "ml-bars__sub", text: b.sub })
          ]);
        }));
    }

    /* 今日學習重點 — no "today's planned focus" Runtime exists anywhere
       in this repo (same gap as Home's 今日任務). Honest Empty State,
       never Mock content. */
    var focus = el("p", { class: "ml-record__empty", text: "今天沒有安排學習重點。" });

    return el("section", { class: "card ml-record", "aria-label": "學習記錄" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "學習記錄" }),
        tabsWrap
      ]),
      el("p", { class: "ml-record__caption", text: "學習時數（小時）" }),
      body,
      el("p", { class: "ml-record__caption ml-record__caption--focus", text: "今日學習重點" }),
      focus
    ]);
  }

  /* ---- Weekly report: radar chart ---------------------------------------
     Real 本週/上週 per-subject hours from AHS.MaterialRuntime (same
     week-boundary math as computeWeekBars, shifted back 7 days for 上週).
     No fabricated comparison numbers. Shows Empty State when there are
     no materials at all yet. */
  function computeWeeklyRadar() {
    var thisMonday = startOfWeek(new Date());
    var lastMonday = new Date(thisMonday.getTime() - 7 * 86400000);
    var bySubjectNow = {}, bySubjectLast = {};
    materials().forEach(function (m) {
      if (!m.lastLearningAt || typeof m.learningTime !== "number") { return; }
      var d = new Date(m.lastLearningAt);
      if (d >= thisMonday && d < new Date(thisMonday.getTime() + 7 * 86400000)) {
        bySubjectNow[m.subject] = (bySubjectNow[m.subject] || 0) + m.learningTime;
      } else if (d >= lastMonday && d < thisMonday) {
        bySubjectLast[m.subject] = (bySubjectLast[m.subject] || 0) + m.learningTime;
      }
    });
    var subjects = {};
    Object.keys(bySubjectNow).forEach(function (s) { subjects[s] = true; });
    Object.keys(bySubjectLast).forEach(function (s) { subjects[s] = true; });
    var keys = Object.keys(subjects);
    if (!keys.length) { keys = materials().slice(0, 6).map(function (m) { return m.subject; }); }
    var seen = {};
    keys = keys.filter(function (s) { if (seen[s]) { return false; } seen[s] = true; return true; }).slice(0, 6);

    var radar = keys.map(function (s) {
      return {
        subject: s,
        now: Math.round(((bySubjectNow[s] || 0) / 60) * 10) / 10,
        last: Math.round(((bySubjectLast[s] || 0) / 60) * 10) / 10
      };
    });
    var max = radar.reduce(function (m, r) { return Math.max(m, r.now, r.last); }, 0);
    return { radar: radar, radarMax: max > 0 ? max : 5 };
  }

  function radarChart(weekly) {
    var axes = weekly.radar;
    var n = axes.length;
    var max = weekly.radarMax || 10;
    var CX = 130, CY = 130, R = 100;

    function point(i, value) {
      var ang = (Math.PI * 2 * i / n) - Math.PI / 2;
      var r = (value / max) * R;
      return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
    }
    function ringPoly(frac) {
      var pts = [];
      for (var i = 0; i < n; i++) { pts.push(point(i, max * frac).map(function (v) { return v.toFixed(1); }).join(",")); }
      return pts.join(" ");
    }
    function polyString(key) {
      var s = [];
      for (var i = 0; i < n; i++) {
        var p = point(i, axes[i][key]);
        s.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
      }
      return s.join(" ");
    }

    var rings = [0.25, 0.5, 0.75, 1].map(function (f) {
      return '<polygon points="' + ringPoly(f) + '" fill="none" stroke="#eceef3" stroke-width="1"/>';
    }).join("");

    var spokes = "";
    for (var i = 0; i < n; i++) {
      var p = point(i, max);
      spokes += '<line x1="' + CX + '" y1="' + CY + '" x2="' + p[0].toFixed(1) +
        '" y2="' + p[1].toFixed(1) + '" stroke="#eceef3" stroke-width="1"/>';
    }

    var lastPoly = '<polygon points="' + polyString("last") + '" fill="#c9c2ec55" stroke="#b7aee0" stroke-width="1.5"/>';
    var nowPoly = '<polygon points="' + polyString("now") + '" fill="#7c5cff33" stroke="#7c5cff" stroke-width="2"/>';

    var labels = "";
    for (var j = 0; j < n; j++) {
      var lp = point(j, max * 1.16);
      var subj = AHS.Subjects[axes[j].subject] || { name: axes[j].subject };
      var anchor = "middle";
      if (lp[0] > CX + 5) { anchor = "start"; }
      else if (lp[0] < CX - 5) { anchor = "end"; }
      labels += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) +
        '" font-size="11" fill="#6b7280" text-anchor="' + anchor +
        '" font-family="inherit">' + subj.name + '</text>';
    }

    var svg =
      '<svg viewBox="0 0 260 260" role="img" aria-label="週報告雷達圖" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      rings + spokes + lastPoly + nowPoly + labels + '</svg>';

    return el("div", { class: "ml-radar__chart", html: svg });
  }

  function weeklyReport() {
    var hasAnyMaterial = materials().length > 0;

    var moreLink = el("span", { class: "card__more card__more--soon" }, [
      el("span", { text: "查看全部" }),
      el("span", { class: "ml-tab__soon", text: "Coming Soon" })
    ]);

    if (!hasAnyMaterial) {
      return el("section", { class: "card ml-weekly", "aria-label": "週報告" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "週報告" }),
          moreLink
        ]),
        el("p", { class: "ml-record__empty", text: "尚無學習紀錄，無法產生週報告。" })
      ]);
    }

    var w = computeWeeklyRadar();
    var legend = el("div", { class: "ml-radar__legend" }, [
      el("span", { class: "ml-radar__legend-item" }, [
        el("span", { class: "ml-radar__swatch ml-radar__swatch--now" }),
        el("span", { text: "本週學習時數（小時）" })
      ]),
      el("span", { class: "ml-radar__legend-item" }, [
        el("span", { class: "ml-radar__swatch ml-radar__swatch--last" }),
        el("span", { text: "上週學習時數（小時）" })
      ])
    ]);

    return el("section", { class: "card ml-weekly", "aria-label": "週報告" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "週報告" }),
        moreLink
      ]),
      radarChart(w),
      legend
    ]);
  }

  /* ---- Calendar (Issue #026) ----------------------------------------------
     Real system date + real per-day AHS.MaterialRuntime aggregation.
     Real 上一月/下一月/今日 navigation (re-renders the same real
     computation for whichever month is in view). Real 日期點擊 feedback
     (actual aggregated minutes for that day, or an honest "沒有學習記錄"). */
  function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
  function firstWeekdayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

  function computeCalendarModel(viewYear, viewMonth) {
    var now = new Date();
    var isCurrentMonth = (viewYear === now.getFullYear() && viewMonth === now.getMonth());
    var minutesByDay = {};
    materials().forEach(function (m) {
      if (!m.lastLearningAt) { return; }
      var d = new Date(m.lastLearningAt);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        minutesByDay[d.getDate()] = (minutesByDay[d.getDate()] || 0) + (typeof m.learningTime === "number" ? m.learningTime : 0);
      }
    });
    var levels = {};
    Object.keys(minutesByDay).forEach(function (day) {
      var hours = minutesByDay[day] / 60;
      levels[day] = hours > 3 ? 4 : hours > 2 ? 3 : hours > 1 ? 2 : hours > 0 ? 1 : 0;
    });
    return {
      monthLabel: viewYear + " 年 " + (viewMonth + 1) + " 月",
      firstWeekday: firstWeekdayOfMonth(viewYear, viewMonth),
      daysInMonth: daysInMonth(viewYear, viewMonth),
      today: isCurrentMonth ? now.getDate() : null,
      levels: levels,
      minutesByDay: minutesByDay,
      legend: [
        { label: "0-1 小時", tone: "#c7f0da" },
        { label: "1-2 小時", tone: "#7fd8a8" },
        { label: "2-3 小時", tone: "#3fb877" },
        { label: "3 小時以上", tone: "#1f8f52" },
        { label: "無記錄", tone: "#eceef3" }
      ]
    };
  }

  function calendar(status) {
    var now = new Date();
    var viewYear = now.getFullYear();
    var viewMonth = now.getMonth();

    var body = el("div", { class: "ml-cal__body" });
    var monthLabelEl = el("span", { class: "ml-cal__month" });

    function render() {
      var cal = computeCalendarModel(viewYear, viewMonth);
      monthLabelEl.textContent = cal.monthLabel;

      var week = ["日", "一", "二", "三", "四", "五", "六"];
      var head = el("div", { class: "ml-cal__weekdays" },
        week.map(function (d) { return el("span", { class: "ml-cal__weekday", text: d }); }));

      var cells = [];
      for (var b = 0; b < cal.firstWeekday; b++) {
        cells.push(el("span", { class: "ml-cal__cell ml-cal__cell--empty" }));
      }
      for (var d = 1; d <= cal.daysInMonth; d++) {
        var level = cal.levels[d] || 0;
        var tone = cal.legend[level === 0 ? 4 : level - 1].tone;
        var isToday = d === cal.today;
        var minutes = cal.minutesByDay[d] || 0;
        var dayNum = d;
        var cell = el("button", {
          type: "button",
          class: "ml-cal__cell" + (isToday ? " is-today" : ""),
          "aria-label": cal.monthLabel + " " + dayNum + " 日" + (minutes ? "，學習 " + minutes + " 分鐘" : "，沒有學習記錄")
        }, [
          el("span", { class: "ml-cal__num", text: String(d) }),
          level > 0
            ? el("span", { class: "ml-cal__dot", style: "background-color:" + tone })
            : null
        ]);
        cell.addEventListener("click", function (dayNum, minutes) {
          return function () {
            status.textContent = minutes
              ? cal.monthLabel + dayNum + "日：學習 " + minutes + " 分鐘"
              : cal.monthLabel + dayNum + "日：沒有學習記錄";
            status.removeAttribute("hidden");
          };
        }(dayNum, minutes));
        cells.push(cell);
      }

      var legend = el("div", { class: "ml-cal__legend" },
        cal.legend.map(function (lg) {
          return el("span", { class: "ml-cal__legend-item" }, [
            el("span", { class: "ml-cal__legend-dot", style: "background-color:" + lg.tone }),
            el("span", { text: lg.label })
          ]);
        }));

      body.innerHTML = "";
      body.appendChild(head);
      body.appendChild(el("div", { class: "ml-cal__grid" }, cells));
      body.appendChild(legend);
    }

    var prevBtn = el("button", { type: "button", class: "ml-cal__nav", "aria-label": "上個月", html: AHS.Icons.chevronRight('style="transform:rotate(180deg)"') });
    prevBtn.addEventListener("click", function () {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });
    var nextBtn = el("button", { type: "button", class: "ml-cal__nav", "aria-label": "下個月", html: AHS.Icons.chevronRight() });
    nextBtn.addEventListener("click", function () {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });
    var todayBtn = el("button", { type: "button", class: "ml-cal__today", text: "今日" });
    todayBtn.addEventListener("click", function () {
      var n = new Date();
      viewYear = n.getFullYear();
      viewMonth = n.getMonth();
      render();
    });

    render();

    return el("section", { class: "card ml-cal", "aria-label": "學習日曆" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "學習日曆" }),
        el("div", { class: "ml-cal__ctrls" }, [
          prevBtn, monthLabelEl, nextBtn, todayBtn
        ])
      ]),
      body
    ]);
  }

  /* ---- Badges -------------------------------------------------------------
     Sprint 6.6 Hotfix (Runtime QA Rework): no achievement/badge-earning
     Runtime exists anywhere in this repo — defining earn-thresholds now
     would be new gamification logic (a new feature), out of scope for a
     Bug Fix. Per this round's explicit "Mock Data 不得出現在 Production"
     standard, the illustrative badge catalog (including the
     "最近獲得...2024/05/17" Mock date) is no longer shown at all — this
     section is now a genuine Empty State, consistent with every other
     section on this page. "分享成就" stays visibly Disabled + Coming
     Soon rather than disappearing, so the card isn't empty chrome with
     no explanation. */
  function badges() {
    var moreLink = el("span", { class: "card__more card__more--soon" }, [
      el("span", { text: "查看全部" }),
      el("span", { class: "ml-tab__soon", text: "Coming Soon" })
    ]);

    var shareBtn = el("button", {
      type: "button", class: "ml-badges__share is-disabled", disabled: "disabled",
      "aria-label": "分享成就（尚未支援，敬請期待）"
    }, [
      el("span", { html: AHS.Icons.share() }),
      el("span", { text: "分享成就" }),
      el("span", { class: "ml-tab__soon", text: "Coming Soon" })
    ]);

    return el("section", { class: "card ml-badges", "aria-label": "成就徽章" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "成就徽章" }),
        moreLink
      ]),
      el("p", { class: "ml-record__empty", text: "尚無成就紀錄。完成更多學習與測驗後，這裡會顯示你獲得的徽章。" }),
      el("div", { class: "ml-badges__recent ml-badges__recent--empty" }, [shareBtn])
    ]);
  }

  /* ---- Progress -------------------------------------------------------
     Real per-subject average of AHS.MaterialRuntime's own `progress`
     field (existing, per-material Schema field — not a new one). Empty
     State when there are no materials at all. */
  function computeSubjectProgress() {
    var bySubject = {};
    materials().forEach(function (m) {
      if (!bySubject[m.subject]) { bySubject[m.subject] = { total: 0, count: 0 }; }
      bySubject[m.subject].total += (typeof m.progress === "number" ? m.progress : 0);
      bySubject[m.subject].count += 1;
    });
    return Object.keys(bySubject).map(function (s) {
      var avg = Math.round(bySubject[s].total / bySubject[s].count);
      return { subject: s, percent: avg, status: avg >= 100 ? "已完成" : avg > 0 ? "進行中" : "尚未開始" };
    });
  }

  function progress() {
    var items = computeSubjectProgress();
    var moreLink = el("span", { class: "card__more card__more--soon" }, [
      el("span", { text: "查看全部" }),
      el("span", { class: "ml-tab__soon", text: "Coming Soon" })
    ]);

    var body = items.length
      ? el("div", { class: "ml-progress__grid" },
          items.map(function (it) {
            var subj = AHS.Subjects[it.subject] || { name: it.subject, hex: "#6b7280" };
            return el("div", { class: "ml-progress__item" }, [
              el("div", { class: "ml-progress__top" }, [
                el("span", { class: "ml-progress__dot", style: "background-color:" + subj.hex }),
                el("span", { class: "ml-progress__name", text: subj.name }),
                el("span", { class: "ml-progress__pct", text: it.percent + "%" })
              ]),
              el("div", { class: "progressbar" }, [
                el("div", { class: "progressbar__fill",
                  style: "width:" + it.percent + "%;background-color:" + subj.hex })
              ]),
              el("span", { class: "ml-progress__status", text: it.status })
            ]);
          }))
      : el("p", { class: "ml-record__empty", text: "尚無教材，無法顯示科目進度。" });

    return el("section", { class: "card ml-progress", "aria-label": "科目進度" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "科目進度" }),
        moreLink
      ]),
      body
    ]);
  }

  /* create() — Sprint 6.6 Hotfix (Runtime QA Rework): no parameter, no
     AHS.Mock reference anywhere in this file anymore — the last
     remaining Mock read path (badges' catalog + recent-earned date) was
     removed this round. Every section is computed live from real
     Runtimes, with an honest Empty State wherever no real data exists. */
  function create() {
    var status = el("p", { class: "ml-status", "aria-live": "polite", hidden: "hidden" });

    function slot(area, node) {
      var w = el("div", { class: "ml-grid__" + area });
      w.appendChild(node);
      return w;
    }

    var grid = el("div", { class: "ml-grid" }, [
      slot("overview", overview()),
      slot("record", record()),
      slot("weekly", weeklyReport()),
      slot("calendar", calendar(status)),
      slot("badges", badges()),
      slot("progress", progress())
    ]);

    return el("div", { class: "ml-page" }, [grid, status]);
  }

  return { create: create };
})();
