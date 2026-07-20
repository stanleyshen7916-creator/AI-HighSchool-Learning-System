/* components/MyLearning.js — 我的學習 (My Learning) page.
   Overview stats + learning record (bar chart + today focus) + weekly
   report (SVG radar chart) + learning calendar + achievement badges +
   subject progress. All Mock. PascalCase under window.AHS.
   Radar chart and calendar are pure inline SVG / CSS (no chart library). */
window.AHS = window.AHS || {};
AHS.MyLearning = (function () {
  "use strict";
  var el = AHS.UI.el;

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* ---- Overview -------------------------------------------------------- */
  function overview(data) {
    var ov = data.overview;
    var stats = el("div", { class: "ml-overview__stats" },
      ov.stats.map(function (s) {
        var deltaClass = s.tone === "fire" ? " is-fire" : " is-ok";
        return el("div", { class: "ml-overview__stat" }, [
          el("span", { class: "ml-overview__stat-icon", html: AHS.Icons[s.icon]() }),
          el("span", { class: "ml-overview__stat-label", text: s.label }),
          el("strong", { class: "ml-overview__stat-value" }, [
            el("span", { text: s.value }),
            el("small", { text: " " + s.unit })
          ]),
          el("span", { class: "ml-overview__stat-delta" + deltaClass }, [
            s.tone === "fire" ? el("span", { class: "ml-overview__fire", html: AHS.Icons.fire() }) : null,
            el("span", { text: s.delta })
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

  /* ---- Learning record: bar chart + today focus ----------------------- */
  function record(data, status) {
    var rec = data.record;
    var max = rec.bars.reduce(function (m, b) { return Math.max(m, b.hours); }, 0) || 1;

    var tabs = el("div", { class: "ml-tabs" },
      rec.tabs.map(function (t, i) {
        /* WO-005 (Sprint 6.6 GitHub QA Fix), Option B: only 本週 has a
           real data source (rec.bars, above). 本月/今年/全部 would need
           a historical-learning-by-period Runtime that doesn't exist
           anywhere in this repo — building one is a new feature, out of
           scope here. Rather than leave them clickable with no real
           effect, they're disabled with a "Coming Soon" indicator. */
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
            Array.prototype.forEach.call(tabs.children, function (c) { c.classList.remove("is-active"); });
            b.classList.add("is-active");
          });
        }
        return b;
      }));

    var chart = el("div", { class: "ml-bars" },
      rec.bars.map(function (b) {
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

    var focus = el("ul", { class: "ml-focus__list" },
      rec.todayFocus.map(function (f) {
        var subj = AHS.Subjects[f.subject];
        return el("li", { class: "ml-focus__item" + (f.done ? " is-done" : "") }, [
          el("span", { class: "ml-focus__time", text: f.time }),
          chip(f.subject),
          el("span", { class: "ml-focus__unit", text: f.unit }),
          el("span", { class: "ml-focus__min", text: f.minutes + " 分鐘" }),
          el("span", { class: "ml-focus__check" + (f.done ? " is-on" : ""),
            html: f.done ? AHS.Icons.check() : "" })
        ]);
      }));

    return el("section", { class: "card ml-record", "aria-label": rec.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: rec.title }),
        tabs
      ]),
      el("p", { class: "ml-record__caption", text: "學習時數（小時）" }),
      chart,
      el("p", { class: "ml-record__caption ml-record__caption--focus", text: "今日學習重點" }),
      focus
    ]);
  }

  /* ---- Weekly report: radar chart ------------------------------------- */
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
      var subj = AHS.Subjects[axes[j].subject];
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

  function weeklyReport(data) {
    var w = data.weekly;
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
    var summary = el("div", { class: "ml-weekly__summary" },
      w.summary.map(function (s) {
        return el("div", { class: "ml-weekly__stat" }, [
          el("span", { class: "ml-weekly__stat-label", text: s.label }),
          el("strong", { class: "ml-weekly__stat-value" }, [
            el("span", { text: s.value }), el("small", { text: " " + s.unit })
          ]),
          el("span", { class: "ml-weekly__stat-delta", text: s.delta })
        ]);
      }));

    return el("section", { class: "card ml-weekly", "aria-label": w.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title" }, [
          el("span", { text: w.title }),
          el("span", { class: "ml-weekly__range", text: " " + w.range })
        ]),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      radarChart(w),
      legend,
      summary
    ]);
  }

  /* ---- Calendar -------------------------------------------------------- */
  function calendar(data, status) {
    var cal = data.calendar;
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
      var cell = el("span", {
        class: "ml-cal__cell" + (isToday ? " is-today" : "")
      }, [
        el("span", { class: "ml-cal__num", text: String(d) }),
        level > 0
          ? el("span", { class: "ml-cal__dot", style: "background-color:" + tone })
          : null
      ]);
      cells.push(cell);
    }

    var legend = el("div", { class: "ml-cal__legend" },
      cal.legend.map(function (lg) {
        return el("span", { class: "ml-cal__legend-item" }, [
          el("span", { class: "ml-cal__legend-dot", style: "background-color:" + lg.tone }),
          el("span", { text: lg.label })
        ]);
      }));

    function navBtn(icon, label) {
      var btn = el("button", { type: "button", class: "ml-cal__nav", "aria-label": label,
        html: AHS.Icons.chevronRight(icon === "prev" ? 'style="transform:rotate(180deg)"' : "") });
      btn.addEventListener("click", function () {
        status.textContent = "（Mock）" + label;
        status.removeAttribute("hidden");
      });
      return btn;
    }
    var todayBtn = el("button", { type: "button", class: "ml-cal__today", text: "今日" });
    todayBtn.addEventListener("click", function () {
      status.textContent = "（Mock）回到今日"; status.removeAttribute("hidden");
    });

    return el("section", { class: "card ml-cal", "aria-label": cal.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: cal.title }),
        el("div", { class: "ml-cal__ctrls" }, [
          navBtn("prev", "上個月"),
          el("span", { class: "ml-cal__month", text: cal.monthLabel }),
          navBtn("next", "下個月"),
          todayBtn
        ])
      ]),
      head,
      el("div", { class: "ml-cal__grid" }, cells),
      legend
    ]);
  }

  /* ---- Badges ---------------------------------------------------------- */
  function badges(data) {
    var bd = data.badges;
    var grid = el("div", { class: "ml-badges__grid" },
      bd.items.map(function (b) {
        return el("div", { class: "ml-badge" }, [
          el("span", { class: "ml-badge__icon",
            style: "color:" + b.tone + ";background-color:" + b.tone + "1a",
            html: AHS.Icons[b.icon]() }),
          el("span", { class: "ml-badge__label", text: b.label }),
          el("span", { class: "ml-badge__desc", text: b.desc })
        ]);
      }));

    var shareBtn = el("button", { type: "button", class: "ml-badges__share" }, [
      el("span", { html: AHS.Icons.share() }),
      el("span", { text: "分享成就" })
    ]);

    return el("section", { class: "card ml-badges", "aria-label": bd.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: bd.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      grid,
      el("div", { class: "ml-badges__recent" }, [
        el("span", { class: "ml-badges__recent-icon", html: AHS.Icons.quiz() }),
        el("div", { class: "ml-badges__recent-meta" }, [
          el("span", { class: "ml-badges__recent-label", text: "最近獲得：" + bd.recent.label }),
          el("span", { class: "ml-badges__recent-desc", text: bd.recent.desc + " · " + bd.recent.date })
        ]),
        shareBtn
      ])
    ]);
  }

  /* ---- Progress -------------------------------------------------------- */
  function progress(data) {
    var pr = data.progress;
    var grid = el("div", { class: "ml-progress__grid" },
      pr.items.map(function (it) {
        var subj = AHS.Subjects[it.subject];
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
      }));

    return el("section", { class: "card ml-progress", "aria-label": pr.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: pr.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      grid
    ]);
  }

  /* create(model?) — model defaults to AHS.Mock.myLearning. */
  function create(model) {
    var data = model || AHS.Mock.myLearning;
    var status = el("p", { class: "ml-status", "aria-live": "polite", hidden: "hidden" });

    function slot(area, node) {
      var w = el("div", { class: "ml-grid__" + area });
      w.appendChild(node);
      return w;
    }

    var grid = el("div", { class: "ml-grid" }, [
      slot("overview", overview(data)),
      slot("record", record(data, status)),
      slot("weekly", weeklyReport(data)),
      slot("calendar", calendar(data, status)),
      slot("badges", badges(data)),
      slot("progress", progress(data))
    ]);

    return el("div", { class: "ml-page" }, [grid, status]);
  }

  return { create: create };
})();
