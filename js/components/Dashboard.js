/* components/Dashboard.js — 學習儀表板 (Learning Dashboard) page.
   Banner + 5 stat cards + 學習趨勢 (dual-line SVG chart) + 學習時間分布
   (SVG donut) + 學習進度 (SVG ring + subject bars) + 知識點掌握度 Top10
   (horizontal bars) on the main column; 今日任務 + 科目狀態 + AI 學習建議
   on the right rail. All Mock. Pure inline SVG/CSS charts (no library).
   Reuses existing patterns/tokens; PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.Dashboard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */
  var OTHER = "#c7cbd6";

  function subjHex(key) {
    return (AHS.Subjects[key] && AHS.Subjects[key].hex) || OTHER;
  }

  /* ---- Banner ---------------------------------------------------------- */
  function banner(data) {
    return el("section", { class: "dash-banner", "aria-label": data.title }, [
      el("div", { class: "dash-banner__text" }, [
        el("h1", { class: "dash-banner__title", text: data.title }),
        el("p", { class: "dash-banner__subtitle", text: data.subtitle })
      ]),
      el("div", {
        class: "dash-banner__figure qiaoqiao-bust qiaoqiao-bust--xl",
        html: AHS.Qiaoqiao.bust("cheer")
      })
    ]);
  }

  /* ---- Stat cards ------------------------------------------------------ */
  function statCards(data) {
    return el("div", { class: "dash-stats" },
      data.stats.map(function (s) {
        return el("div", { class: "card dash-stat" }, [
          el("span", { class: "dash-stat__icon",
            style: "color:" + s.tone + ";background-color:" + s.tone + "1a",
            html: AHS.Icons[s.icon]() }),
          el("div", { class: "dash-stat__body" }, [
            el("span", { class: "dash-stat__label", text: s.label }),
            el("strong", { class: "dash-stat__value" }, [
              el("span", { text: s.value }),
              el("small", { text: " " + s.unit })
            ]),
            el("span", { class: "dash-stat__delta", text: s.delta })
          ])
        ]);
      }));
  }

  /* ---- Line chart (學習趨勢) ------------------------------------------- */
  function lineChart(trend) {
    var W = 700, H = 300, padL = 40, padR = 44, padT = 24, padB = 40;
    var n = trend.days.length;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function px(i) { return padL + (plotW * i / (n - 1)); }
    function pyH(h) { return padT + plotH * (1 - h / trend.hoursMax); }
    function pyA(a) { return padT + plotH * (1 - a / 100); }

    var grid = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var y = padT + plotH * f;
      grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) +
        '" y2="' + y.toFixed(1) + '" stroke="#eceef3" stroke-width="1"/>';
    });
    // left labels (hours), right labels (%)
    var labels = "";
    [0, 10, 20, 30].forEach(function (hv) {
      var y = pyH(hv) + 3;
      labels += '<text x="' + (padL - 8) + '" y="' + y.toFixed(1) + '" font-size="10" fill="#9aa0ab" text-anchor="end">' + hv + '</text>';
    });
    [0, 25, 50, 75, 100].forEach(function (av) {
      var y = pyA(av) + 3;
      labels += '<text x="' + (W - padR + 8) + '" y="' + y.toFixed(1) + '" font-size="10" fill="#9aa0ab" text-anchor="start">' + av + '%</text>';
    });

    function poly(getY, key) {
      return trend.days.map(function (d, i) { return px(i).toFixed(1) + "," + getY(d[key]).toFixed(1); }).join(" ");
    }
    var hoursPoly = '<polyline points="' + poly(pyH, "hours") + '" fill="none" stroke="#7c5cff" stroke-width="2.5" stroke-linejoin="round"/>';
    var accPoly = '<polyline points="' + poly(pyA, "acc") + '" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linejoin="round"/>';

    var dots = "", vals = "", xlabels = "";
    trend.days.forEach(function (d, i) {
      var x = px(i);
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + pyH(d.hours).toFixed(1) + '" r="3.5" fill="#7c5cff"/>';
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + pyA(d.acc).toFixed(1) + '" r="3.5" fill="#38bdf8"/>';
      vals += '<text x="' + x.toFixed(1) + '" y="' + (pyH(d.hours) - 8).toFixed(1) + '" font-size="10" fill="#6b5bd0" text-anchor="middle" font-weight="700">' + d.hours + '</text>';
      vals += '<text x="' + x.toFixed(1) + '" y="' + (pyA(d.acc) + 16).toFixed(1) + '" font-size="10" fill="#1d9bd1" text-anchor="middle" font-weight="700">' + d.acc + '%</text>';
      xlabels += '<text x="' + x.toFixed(1) + '" y="' + (H - 12) + '" font-size="10" fill="#6b7280" text-anchor="middle">' + d.label + '</text>';
    });

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="學習趨勢" xmlns="http://www.w3.org/2000/svg">' +
      grid + labels + hoursPoly + accPoly + dots + vals + xlabels + '</svg>';

    var legend = el("div", { class: "dash-legend" }, [
      el("span", { class: "dash-legend__item" }, [
        el("span", { class: "dash-legend__dot", style: "background-color:#7c5cff" }),
        el("span", { text: "學習時間（小時）" })
      ]),
      el("span", { class: "dash-legend__item" }, [
        el("span", { class: "dash-legend__dot", style: "background-color:#38bdf8" }),
        el("span", { text: "正確率（%）" })
      ])
    ]);

    return el("section", { class: "card dash-trend", "aria-label": "學習趨勢" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "學習趨勢" }),
        el("span", { class: "dash-pill", text: trend.range })
      ]),
      legend,
      el("div", { class: "dash-trend__chart", html: svg })
    ]);
  }

  /* ---- Donut (學習時間分布) -------------------------------------------- */
  function donut(dist) {
    var R = 42, CX = 60, CY = 60, C = 2 * Math.PI * R, off = 0;
    var segs = dist.items.map(function (d) {
      var hex = d.subject === "other" ? OTHER : subjHex(d.subject);
      var dash = (d.percent / 100) * C;
      var s = '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="' + hex +
        '" stroke-width="16" stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) +
        '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += dash; return s;
    }).join("");
    var svg = '<svg viewBox="0 0 120 120" role="img" aria-label="學習時間分布" xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="rotate(-90 60 60)">' + segs + '</g>' +
      '<circle cx="60" cy="60" r="27" fill="#ffffff"/>' +
      '<text x="60" y="56" font-size="9" fill="#9aa0ab" text-anchor="middle">總計</text>' +
      '<text x="60" y="70" font-size="15" fill="#1f2430" text-anchor="middle" font-weight="800">' + dist.total + '</text>' +
      '<text x="60" y="82" font-size="8" fill="#9aa0ab" text-anchor="middle">' + dist.unit + '</text></svg>';

    var legend = el("ul", { class: "dash-donut__legend" },
      dist.items.map(function (d) {
        var hex = d.subject === "other" ? OTHER : subjHex(d.subject);
        return el("li", { class: "dash-donut__li" }, [
          el("span", { class: "dash-donut__sw", style: "background-color:" + hex }),
          el("span", { class: "dash-donut__name", text: d.label }),
          el("span", { class: "dash-donut__val", text: d.percent + "%" })
        ]);
      }));

    return el("section", { class: "card dash-dist", "aria-label": "學習時間分布" }, [
      el("h2", { class: "card__title", text: "學習時間分布" }),
      el("div", { class: "dash-donut" }, [
        el("div", { class: "dash-donut__chart", html: svg }),
        legend
      ])
    ]);
  }

  /* ---- Ring helper ----------------------------------------------------- */
  function ringSvg(percent, size, stroke, color, label) {
    var r = (size - stroke) / 2, c = size / 2, C = 2 * Math.PI * r;
    var dash = (percent / 100) * C;
    var mid = label
      ? '<text x="' + c + '" y="' + (c - 2) + '" font-size="' + (size * 0.26) + '" fill="#1f2430" text-anchor="middle" font-weight="800">' + percent + '<tspan font-size="' + (size * 0.14) + '">%</tspan></text>' +
        '<text x="' + c + '" y="' + (c + size * 0.17) + '" font-size="' + (size * 0.11) + '" fill="#9aa0ab" text-anchor="middle">' + label + '</text>'
      : '<text x="' + c + '" y="' + (c + size * 0.09) + '" font-size="' + (size * 0.24) + '" fill="#1f2430" text-anchor="middle" font-weight="800">' + percent + '%</text>';
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + percent + '%" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="#eceef3" stroke-width="' + stroke + '"/>' +
      '<g transform="rotate(-90 ' + c + ' ' + c + ')">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) + '"/></g>' + mid + '</svg>';
  }

  /* ---- Progress (學習進度) --------------------------------------------- */
  function progressCard(prog) {
    var bars = el("div", { class: "dash-prog__bars" },
      prog.items.map(function (it) {
        var hex = subjHex(it.subject);
        return el("div", { class: "dash-prog__row" }, [
          el("span", { class: "dash-prog__name", text: AHS.Subjects[it.subject].name }),
          el("div", { class: "progressbar dash-prog__bar" }, [
            el("div", { class: "progressbar__fill", style: "width:" + it.percent + "%;background-color:" + hex })
          ]),
          el("span", { class: "dash-prog__pct", text: it.percent + "%" })
        ]);
      }));
    return el("section", { class: "card dash-prog", "aria-label": "學習進度" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "學習進度" }),
        el("span", { class: "dash-pill", text: "本學期" })
      ]),
      el("div", { class: "dash-prog__inner" }, [
        el("div", { class: "dash-prog__ring", html: ringSvg(prog.overall, 130, 14, "#7c5cff", "整體進度") }),
        bars
      ])
    ]);
  }

  /* ---- Knowledge Top 10 ------------------------------------------------ */
  function knowledgeCard(items) {
    var rows = el("div", { class: "dash-know__list" },
      items.map(function (it) {
        return el("div", { class: "dash-know__row" }, [
          el("span", { class: "dash-know__name", text: it.name }),
          el("div", { class: "dash-know__track" }, [
            el("div", { class: "dash-know__fill", style: "width:" + it.percent + "%" })
          ]),
          el("span", { class: "dash-know__pct", text: it.percent + "%" })
        ]);
      }));
    return el("section", { class: "card dash-know", "aria-label": "知識點掌握度" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "知識點掌握度（Top 10）" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }), el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      rows
    ]);
  }

  /* ---- Right rail: 今日任務 -------------------------------------------- */
  function todayTasks(t, status) {
    var pct = Math.round((t.goalDone / t.goalTotal) * 100);
    var list = el("ul", { class: "dash-tasks__list" },
      t.items.map(function (it) {
        var check = el("button", { type: "button",
          class: "dash-tasks__check" + (it.done ? " is-on" : ""),
          "aria-pressed": it.done ? "true" : "false",
          "aria-label": it.unit,
          html: it.done ? AHS.Icons.check() : "" });
        check.addEventListener("click", function () {
          var on = check.getAttribute("aria-pressed") === "true";
          check.setAttribute("aria-pressed", on ? "false" : "true");
          check.classList.toggle("is-on", !on);
          check.innerHTML = on ? "" : AHS.Icons.check();
          status.textContent = "" + (on ? "取消完成：" : "完成任務：") + it.unit;
          status.removeAttribute("hidden");
        });
        return el("li", { class: "dash-task" + (it.done ? " is-done" : "") }, [
          check,
          el("span", { class: "dash-task__unit", text: it.unit }),
          el("span", { class: "dash-task__pts", text: "+" + it.points + " 積分" })
        ]);
      }));

    return el("section", { class: "card dash-tasks", "aria-label": "今日任務" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "今日任務" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }), el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("div", { class: "dash-goal" }, [
        el("span", { class: "dash-goal__icon", html: AHS.Icons.award() }),
        el("div", { class: "dash-goal__body" }, [
          el("div", { class: "dash-goal__top" }, [
            el("span", { class: "dash-goal__title", text: "今日目標" }),
            el("span", { class: "dash-goal__count" }, [
              el("strong", { text: String(t.goalDone) }),
              el("span", { text: " / " + t.goalTotal })
            ])
          ]),
          el("span", { class: "dash-goal__text", text: t.goalText }),
          el("div", { class: "progressbar dash-goal__bar" }, [
            el("div", { class: "progressbar__fill", style: "width:" + pct + "%" })
          ])
        ])
      ]),
      list
    ]);
  }

  /* ---- Right rail: 科目狀態 -------------------------------------------- */
  function subjectStatus(items) {
    var grid = el("div", { class: "dash-subjects__grid" },
      items.map(function (it) {
        var subj = AHS.Subjects[it.subject], hex = subj.hex;
        return el("div", { class: "dash-subject" }, [
          el("span", { class: "dash-subject__ring",
            html: ringSvg(it.percent, 46, 5, hex, "") }),
          el("div", { class: "dash-subject__meta" }, [
            el("span", { class: "dash-subject__name" }, [
              el("span", { class: "dash-subject__dot", style: "background-color:" + hex }),
              el("span", { text: subj.name })
            ])
          ])
        ]);
      }));
    return el("section", { class: "card dash-subjects", "aria-label": "科目狀態" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "科目狀態" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }), el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      grid
    ]);
  }

  /* ---- Right rail: AI 學習建議 ----------------------------------------- */
  function aiTips(ai) {
    return el("section", { class: "card dash-ai", "aria-label": "AI 學習建議" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "AI 學習建議" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }), el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("div", { class: "dash-ai__box" }, [
        el("div", { class: "dash-ai__row" }, [
          el("span", { class: "dash-ai__spark", html: AHS.Icons.sparkle() }),
          el("p", { class: "dash-ai__intro", text: ai.intro })
        ]),
        el("ul", { class: "dash-ai__tips" },
          ai.tips.map(function (tp) {
            return el("li", { class: "dash-ai__tip" }, [
              el("span", { class: "dash-ai__check", html: AHS.Icons.check() }),
              el("span", { text: tp })
            ]);
          }))
      ]),
      el("div", {
        class: "dash-ai__avatar qiaoqiao-bust qiaoqiao-bust--lg",
        html: AHS.Qiaoqiao.bust("gentle")
      })
    ]);
  }

  /* create(model?) — model defaults to AHS.AppConfig.dashboard. */
  function create(model) {
    /* EO-S7.0-003 Production Cleanup: the Mock 學習分析 dataset is
       removed. Until real analytics derive from the Runtimes, the page
       shows the 正式 Empty State — never fake statistics. */
    var data = model;
    if (!data) {
      return AHS.EmptyState.create({
        title: "尚無學習數據",
        hint: "開始上傳教材並完成練習後，你的學習分析會顯示在這裡。",
        ariaLabel: "學習分析"
      });
    }
    var status = el("p", { class: "dash-status", "aria-live": "polite", hidden: "hidden" });

    var main = el("div", { class: "dash-main" }, [
      banner(data),
      statCards(data),
      el("div", { class: "dash-row2" }, [lineChart(data.trend), donut(data.timeDist)]),
      el("div", { class: "dash-row3" }, [progressCard(data.progress), knowledgeCard(data.knowledge)]),
      status
    ]);

    var rail = el("div", { class: "dash-rail" }, [
      todayTasks(data.todayTasks, status),
      subjectStatus(data.subjectStatus),
      aiTips(data.aiTips)
    ]);

    return el("div", { class: "dash-layout" }, [main, rail]);
  }

  return { create: create };
})();
