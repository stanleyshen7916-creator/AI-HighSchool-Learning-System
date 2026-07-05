/* components/QuizCenter.js — 測驗中心 (Quiz Center) page.
   Banner + filter bar + quiz list + right rail (stat cards / subject
   accuracy donut / history). All Mock. PascalCase component under
   window.AHS. Donut is pure inline SVG (no chart library). */
window.AHS = window.AHS || {};
AHS.QuizCenter = (function () {
  "use strict";
  var el = AHS.UI.el;

  var DIFF_TONE = { "易": "#22b573", "易~中等": "#22b573", "中等": "#f59e0b", "難": "#ef4444" };

  function chip(subjectKey) {
    var subj = AHS.Subjects[subjectKey];
    return el("span", {
      class: "chip",
      style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
    }, [el("span", { text: subj.name })]);
  }

  /* ---- Banner ---------------------------------------------------------- */
  function banner(data) {
    return el("section", { class: "quiz-banner", "aria-label": data.title }, [
      el("div", { class: "quiz-banner__text" }, [
        el("h1", { class: "quiz-banner__title", text: data.title }),
        el("p", { class: "quiz-banner__en", text: data.titleEn }),
        el("p", { class: "quiz-banner__subtitle", text: data.subtitle })
      ]),
      el("div", {
        class: "quiz-banner__figure qiaoqiao-bust qiaoqiao-bust--xl",
        html: AHS.Qiaoqiao.bust("cheer")
      })
    ]);
  }

  /* ---- Filter bar ------------------------------------------------------ */
  function filterBar(data, onSubject, onToggleIncomplete) {
    var subjChips = el("div", { class: "quiz-filter__subjects" },
      data.subjects.map(function (id, i) {
        var label = id === "all" ? "全部科目" : AHS.Subjects[id].name;
        var b = el("button", {
          type: "button",
          class: "quiz-filter__subject" + (i === 0 ? " is-active" : ""),
          "data-id": id, text: label
        });
        b.addEventListener("click", function () {
          var sibs = subjChips.querySelectorAll(".quiz-filter__subject");
          Array.prototype.forEach.call(sibs, function (s) { s.classList.remove("is-active"); });
          b.classList.add("is-active");
          onSubject(id);
        });
        return b;
      }));

    function select(label, options) {
      return el("label", { class: "quiz-select" }, [
        el("span", { class: "quiz-select__label", text: label }),
        el("select", { class: "quiz-select__control", "aria-label": label },
          options.map(function (o) { return el("option", { text: o }); }))
      ]);
    }

    var toggle = el("button", {
      type: "button", class: "quiz-toggle", "aria-pressed": "false"
    }, [
      el("span", { class: "quiz-toggle__track" }, [
        el("span", { class: "quiz-toggle__thumb" })
      ]),
      el("span", { class: "quiz-toggle__label", text: "只看未完成" })
    ]);
    toggle.addEventListener("click", function () {
      var on = toggle.getAttribute("aria-pressed") === "true";
      toggle.setAttribute("aria-pressed", on ? "false" : "true");
      onToggleIncomplete(!on);
    });

    return el("div", { class: "quiz-filter card" }, [
      el("div", { class: "quiz-filter__row" }, [
        el("span", { class: "quiz-filter__caption", text: "科目" }),
        subjChips
      ]),
      el("div", { class: "quiz-filter__row quiz-filter__row--controls" }, [
        select("年級", data.grades),
        select("章節", data.chapters),
        select("難易度", data.difficulties),
        select("題型", data.types),
        toggle,
        select("排序", data.sorts)
      ])
    ]);
  }

  /* ---- Quiz row -------------------------------------------------------- */
  function quizRow(item, status) {
    var subj = AHS.Subjects[item.subject];
    var diffTone = DIFF_TONE[item.difficulty] || "#6b7280";

    var actionBtn = item.done
      ? el("span", { class: "quiz-row__done" }, [
          el("span", { html: AHS.Icons.check() }),
          el("span", { text: "已完成" })
        ])
      : el("button", { type: "button", class: "quiz-row__start" }, [
          el("span", { html: AHS.Icons.play() }),
          el("span", { text: "開始測驗" })
        ]);
    if (!item.done) {
      actionBtn.addEventListener("click", function () {
        status.textContent = "（Mock）開始測驗：" + subj.name + "《" + item.title + "》";
        status.removeAttribute("hidden");
      });
    }

    var more = el("button", {
      type: "button", class: "quiz-row__more",
      "aria-label": "更多", html: AHS.Icons.more()
    });
    more.addEventListener("click", function () {
      status.textContent = "（Mock）更多選項：" + item.title;
      status.removeAttribute("hidden");
    });

    return el("article", {
      class: "quiz-row" + (item.done ? " is-done" : ""),
      "data-subject": item.subject, "data-done": item.done ? "1" : "0"
    }, [
      el("span", {
        class: "quiz-row__icon",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
        html: AHS.Icons.quiz()
      }),
      el("div", { class: "quiz-row__info" }, [
        el("h3", { class: "quiz-row__title", text: item.title }),
        el("div", { class: "quiz-row__tags" }, [
          chip(item.subject),
          el("span", { class: "quiz-row__tag", text: item.grade }),
          el("span", { class: "quiz-row__tag", text: item.chapter })
        ]),
        el("p", { class: "quiz-row__desc" }, [
          el("span", { text: item.count + " 題" }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { text: item.type }),
          el("span", { class: "quiz-row__dot-sep", text: "·" }),
          el("span", { style: "color:" + diffTone + ";font-weight:700", text: item.difficulty })
        ])
      ]),
      el("div", { class: "quiz-row__metrics" }, [
        el("div", { class: "quiz-row__metric" }, [
          el("span", { class: "quiz-row__metric-label", text: "進度" }),
          el("div", { class: "progressbar quiz-row__bar" }, [
            el("div", { class: "progressbar__fill",
              style: "width:" + item.progress + "%;background-color:" + subj.hex })
          ]),
          el("span", { class: "quiz-row__metric-val", text: item.progress + "%" })
        ]),
        el("div", { class: "quiz-row__metric quiz-row__metric--num" }, [
          el("span", { class: "quiz-row__metric-label", text: "正確率" }),
          el("span", { class: "quiz-row__metric-strong", text: item.accuracy + "%" })
        ]),
        el("div", { class: "quiz-row__metric quiz-row__metric--num" }, [
          el("span", { class: "quiz-row__metric-label", text: "最高分" }),
          el("span", { class: "quiz-row__metric-strong", text: item.best + "/100" })
        ])
      ]),
      el("div", { class: "quiz-row__actions" }, [actionBtn, more])
    ]);
  }

  function quizList(data, status) {
    return el("div", { class: "quiz-list" },
      data.items.map(function (it) { return quizRow(it, status); }));
  }

  /* ---- Right rail: stat cards ------------------------------------------ */
  function statCards(data) {
    return el("div", { class: "quiz-stats__grid" },
      data.stats.map(function (s) {
        return el("div", { class: "quiz-stat" }, [
          el("span", { class: "quiz-stat__icon", html: AHS.Icons[s.icon]() }),
          el("span", { class: "quiz-stat__label", text: s.label }),
          el("strong", { class: "quiz-stat__value" }, [
            el("span", { text: s.value }),
            el("small", { text: " " + s.unit })
          ]),
          el("span", { class: "quiz-stat__delta", text: s.delta })
        ]);
      }));
  }

  /* ---- Donut chart (pure SVG) ------------------------------------------ */
  function donut(data) {
    var R = 42, CX = 60, CY = 60;
    var C = 2 * Math.PI * R;
    var total = data.accuracyByStudy.reduce(function (s, d) { return s + d.percent; }, 0) || 1;
    var offset = 0;
    var segs = data.accuracyByStudy.map(function (d) {
      var subj = AHS.Subjects[d.subject];
      var frac = d.percent / total;
      var dash = frac * C;
      var seg =
        '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" ' +
        'stroke="' + subj.hex + '" stroke-width="16" ' +
        'stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
      offset += dash;
      return seg;
    }).join("");

    var svg =
      '<svg viewBox="0 0 120 120" role="img" aria-label="科目正確率分佈" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="rotate(-90 60 60)">' + segs + '</g>' +
      '<circle cx="60" cy="60" r="26" fill="#ffffff"/>' +
      '</svg>';

    var legend = el("ul", { class: "quiz-donut__legend" },
      data.accuracyByStudy.map(function (d) {
        var subj = AHS.Subjects[d.subject];
        return el("li", { class: "quiz-donut__legend-item" }, [
          el("span", { class: "quiz-donut__swatch",
            style: "background-color:" + subj.hex }),
          el("span", { class: "quiz-donut__legend-name", text: subj.name }),
          el("span", { class: "quiz-donut__legend-val", text: d.percent + "%" })
        ]);
      }));

    return el("div", { class: "quiz-donut" }, [
      el("div", { class: "quiz-donut__chart", html: svg }),
      legend
    ]);
  }

  /* ---- History --------------------------------------------------------- */
  function history(data, status) {
    var list = el("div", { class: "quiz-history__list" },
      data.history.map(function (h) {
        var subj = AHS.Subjects[h.subject];
        return el("div", { class: "quiz-history__item" }, [
          el("span", {
            class: "quiz-history__icon",
            style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
            html: AHS.Icons.quiz()
          }),
          el("div", { class: "quiz-history__meta" }, [
            el("span", { class: "quiz-history__title", text: h.title }),
            el("span", { class: "quiz-history__sub", text: subj.name + " · " + h.when })
          ]),
          el("div", { class: "quiz-history__score" }, [
            el("strong", { text: h.score + "分" }),
            el("span", { class: "quiz-history__acc", text: "正確率 " + h.accuracy + "%" })
          ])
        ]);
      }));

    return el("section", { class: "card quiz-history", "aria-label": "歷史紀錄" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "歷史紀錄" }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      list
    ]);
  }

  /* create(model?) — model defaults to AHS.Mock.quiz. */
  function create(model) {
    var data = model || AHS.Mock.quiz;
    var status = el("p", {
      class: "quiz-status", "aria-live": "polite", hidden: "hidden"
    });

    var list = quizList(data, status);

    var subjectFilter = "all";
    var onlyIncomplete = false;
    function applyFilters() {
      var rows = list.querySelectorAll(".quiz-row");
      Array.prototype.forEach.call(rows, function (r) {
        var subjOk = subjectFilter === "all" ||
          r.getAttribute("data-subject") === subjectFilter;
        var doneOk = !onlyIncomplete || r.getAttribute("data-done") === "0";
        r.style.display = (subjOk && doneOk) ? "" : "none";
      });
    }

    var main = el("div", { class: "quiz-main" }, [
      banner(data),
      filterBar(data,
        function (id) { subjectFilter = id; applyFilters(); },
        function (on) { onlyIncomplete = on; applyFilters(); }),
      list,
      status
    ]);

    var rail = el("div", { class: "quiz-rail" }, [
      el("section", { class: "card quiz-stats", "aria-label": "學習統計" }, [
        el("div", { class: "card__head" }, [
          el("h2", { class: "card__title", text: "學習統計" }),
          el("span", { class: "quiz-stats__range", text: "本週" })
        ]),
        statCards(data)
      ]),
      el("section", { class: "card", "aria-label": "科目正確率分佈" }, [
        el("h2", { class: "card__title", text: "科目正確率分佈" }),
        donut(data)
      ]),
      history(data, status)
    ]);

    return el("div", { class: "quiz-layout" }, [main, rail]);
  }

  return { create: create };
})();
