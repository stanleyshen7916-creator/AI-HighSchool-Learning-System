/* components/SummaryCenter.js — 總結中心 / 學習總結 (Summary Center) page.

   EO-S6-006 System Runtime Integration: all Mock Data has been removed.
   Content is driven exclusively by the real AHS.SummaryRuntime (Sprint 6,
   EO-S6-003 — untouched Public API / Schema, only read from here via
   list() and findByMaterialId()). If AHS.SummaryRuntime has no records,
   the mandated Empty State is shown ("尚未建立教材內容。請先上傳教材。")
   — never Mock Data.

   Naming note: EO-S6-006 refers to "SummaryRuntime.findByMaterial()"; the
   actual, already-delivered method (EO-S6-003) is
   findByMaterialId() — same purpose, used here as-is (not renamed, per
   "不得修改 Runtime Schema" / Public API for existing Sprint 6 Runtimes).

   Each Summary Runtime record is rendered as its own card showing the
   fixed five-section format (核心概念/重要定義/易錯重點/必背內容/複習
   建議) exactly as SummaryGenerator.js produces it — no additional
   content (mind map / knowledge tree / related resources / notes) is
   invented, since Summary Runtime's schema has no such fields.
   PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.SummaryCenter = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* ---- Banner ------------------------------------------------------------
     Static copy only now (no per-summary Mock title/subtitle to read).
     Export buttons keep the existing Mock-feedback convention used
     throughout the repo for not-yet-implemented actions (AppShell.js
     profilePanel, Review Center, etc.) — this is a UI-action stub, not
     fabricated content data, so it doesn't conflict with "不得自建
     資料". */
  function banner(status) {
    function exportBtn(cls, icon, label, sub) {
      var b = el("button", { type: "button", class: "sum-export " + cls }, [
        el("span", { class: "sum-export__icon", html: AHS.Icons[icon]() }),
        el("span", { class: "sum-export__text" }, [
          el("strong", { text: label }),
          el("small", { text: sub })
        ])
      ]);
      b.addEventListener("click", function () {
        status.textContent = "（Mock）" + label + "（" + sub + "）";
        status.removeAttribute("hidden");
      });
      return b;
    }
    return el("div", { class: "sum-banner" }, [
      el("div", { class: "sum-banner__titles" }, [
        el("h1", { class: "sum-banner__title", text: "學習總結" }),
        el("p", { class: "sum-banner__subtitle", text: "依教材自動整理的核心概念、定義與複習重點" })
      ]),
      el("div", { class: "sum-banner__actions" }, [
        exportBtn("sum-export--primary", "download", "下載總結", "PDF / DOCX / PPT"),
        exportBtn("sum-export--ghost", "bookmark", "匯出筆記", "Notion / Evernote")
      ])
    ]);
  }

  /* ---- Empty State (mandated, EO-S6-006) --------------------------------
     Shown whenever there is nothing real to display — never replaced
     with Mock Data. */
  function emptyState() {
    return el("section", { class: "card sum-empty", "aria-label": "尚無學習總結" }, [
      el("span", { class: "sum-empty__icon", html: AHS.Icons.summary() }),
      el("p", { class: "sum-empty__title", text: "尚未建立教材內容。" }),
      el("p", { class: "sum-empty__hint", text: "請先上傳教材。" })
    ]);
  }

  /* Sprint 6.6 Runtime QA Round 3 (WO-013, Issue #024): distinct from
     emptyState() above — this is for a deep-link (?materialId=...) into
     ONE specific material that has real materials on record elsewhere
     but genuinely has no Summary Runtime record of its own yet. Wording
     matches the WO exactly ("尚未建立學習總結"), not the generic
     "尚未建立教材內容" (which would be misleading — the material itself
     exists, just not its summary). */
  function noSummaryForMaterialState(materialId) {
    return el("section", { class: "card sum-empty", "aria-label": "尚未建立學習總結" }, [
      el("span", { class: "sum-empty__icon", html: AHS.Icons.summary() }),
      el("p", { class: "sum-empty__title", text: "尚未建立學習總結。" }),
      el("p", { class: "sum-empty__hint", text: materialLabel(materialId) + " 目前還沒有產生學習總結。" })
    ]);
  }

  /* ---- One of the five fixed sections ------------------------------------
     Reuses the existing 重點整理-style numbered list (.sum-kp__*) for
     visual consistency with the rest of the repo. items may legitimately
     be empty (e.g. pitfalls, until upstream Knowledge has real content)
     — shown as an honest "尚無資料", never invented. */
  function sectionList(icon, title, items) {
    var body = (items && items.length)
      ? el("ol", { class: "sum-kp__list" }, items.map(function (text, i) {
          return el("li", { class: "sum-kp__item" }, [
            el("span", { class: "sum-kp__num", text: String(i + 1) }),
            el("span", { class: "sum-kp__text", text: String(text) })
          ]);
        }))
      : el("p", { class: "sum-section__empty", text: "尚無資料" });

    return el("section", { class: "card sum-section", "aria-label": title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title" }, [
          el("span", { class: "sum-ai__spark", html: AHS.Icons[icon]() }),
          el("span", { text: title })
        ])
      ]),
      body
    ]);
  }

  /* ---- One Summary Runtime record ---------------------------------------- */
  function summaryRecordCard(record) {
    var subj = AHS.Subjects[record.subject] || { name: record.subject || "未分類", hex: "#6b7280" };
    var chapterLine = [record.chapter, record.section].filter(Boolean).join(" ｜ ") || "（尚無章節資訊）";

    var head = el("section", { class: "card sum-topic" }, [
      el("div", { class: "sum-topic__id" }, [
        el("span", {
          class: "sum-topic__badge",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
          html: AHS.Icons.summary()
        }),
        el("div", {}, [
          el("span", {
            class: "chip",
            style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
          }, [el("span", { text: subj.name })]),
          el("p", { class: "sum-topic__chapter", text: (record.grade || "") + "｜" + (record.title || "") }),
          el("p", { class: "sum-topic__section", text: chapterLine })
        ])
      ]),
      el("span", { class: "sum-topic__generated", text: "產生時間：" + (record.generatedAt || "—") })
    ]);

    /* Sprint 6.6 Runtime QA Round 3 (WO-013, Issue #024): a real Summary
       record whose five sections are ALL genuinely empty (current
       upstream Knowledge Runtime has no real extracted content yet —
       an honest Stub-pipeline state, not a bug) gets ONE clear
       explanatory block instead of five repetitive, alarming-looking
       "尚無資料" sections. If ANY section has real content, sections
       render individually as before (including honestly-empty ones
       alongside populated ones, for contrast). Never fabricates
       content either way. */
    var fiveSections = [
      { key: "coreConcepts", icon: "sparkle", title: "核心概念" },
      { key: "definitions", icon: "summary", title: "重要定義" },
      { key: "pitfalls", icon: "wrong", title: "易錯重點" },
      { key: "memorize", icon: "bookmark", title: "必背內容" },
      { key: "reviewSuggestions", icon: "refresh", title: "複習建議" }
    ];
    var anyContent = fiveSections.some(function (s) {
      return Array.isArray(record[s.key]) && record[s.key].length;
    });

    var sections;
    if (anyContent) {
      sections = el("div", { class: "sum-section-grid" },
        fiveSections.map(function (s) { return sectionList(s.icon, s.title, record[s.key]); }));
    } else {
      sections = el("section", { class: "card sum-section sum-section--pending", "aria-label": "學習總結內容" }, [
        el("p", { class: "sum-section__pending", text: "此教材的學習總結尚未包含具體內容。" }),
        el("p", { class: "sum-section__pending-hint", text: "教材解析（核心概念／重要定義／易錯重點／必背內容）功能持續開發中，完成後會自動顯示於此。" })
      ]);
    }

    return el("div", { class: "sum-record" }, [head, sections]);
  }

  /* ---- Material filter (EO-S6-006: demonstrates both list() and
     findByMaterialId(), "findByMaterial()" per the EO's wording) -------- */
  /* materialLabel(materialId) — WO-003: dropdown must show human-readable
     metadata ("高一｜國文｜赤壁賦.pdf"), never a raw Runtime id. Looks up
     the real record via AHS.MaterialRuntime.getById() (existing, read-
     only) — falls back to the raw id only if that Runtime isn't loaded
     or the material can't be found (never throws). */
  function materialLabel(materialId) {
    if (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.getById === "function") {
      var m = AHS.MaterialRuntime.getById(materialId);
      if (m) {
        var subj = AHS.Subjects[m.subject];
        var parts = [m.grade, subj ? subj.name : m.subject, m.fileName || m.title].filter(Boolean);
        if (parts.length) { return parts.join("｜"); }
      }
    }
    return materialId;
  }

  function materialFilter(records, onChange, selectedId) {
    var seen = {};
    var materialIds = [];
    records.forEach(function (r) {
      if (r.materialId && !seen[r.materialId]) { seen[r.materialId] = true; materialIds.push(r.materialId); }
    });
    if (materialIds.length < 2) { return null; } /* not worth a filter for 0-1 materials */

    var options = [el("option", { value: "", text: "全部教材" })].concat(
      materialIds.map(function (id) { return el("option", { value: id, text: materialLabel(id) }); })
    );
    var select = el("select", { class: "sum-filter__select" }, options);
    if (selectedId && seen[selectedId]) { select.value = selectedId; }
    select.addEventListener("change", function () { onChange(select.value); });
    return el("div", { class: "sum-filter" }, [
      el("span", { class: "sum-filter__label", text: "篩選教材：" }),
      select
    ]);
  }

  /* create(model?, initialMaterialId?) — model is accepted for
     test/override convenience only; the real page never passes one.
     initialMaterialId (Sprint 6.6 WO-010, Issue #021): when given, the
     page opens already filtered to that one material's Summary Detail
     (via the existing AHS.SummaryRuntime.findByMaterialId()) instead of
     the full list. If that material genuinely has no summary yet, this
     renders the mandated Empty State — never a blank screen. */
  function create(model, initialMaterialId) {
    var status = el("p", {
      class: "sum-status", "aria-live": "polite", hidden: "hidden"
    });

    var body = el("div", { class: "sum-body" });
    var filterSlot = el("div", { class: "sum-filter-slot" });

    function renderRecords(records, forMaterialId) {
      body.innerHTML = "";
      if (!records || !records.length) {
        body.appendChild(forMaterialId ? noSummaryForMaterialState(forMaterialId) : emptyState());
        return;
      }
      records.forEach(function (r) { body.appendChild(summaryRecordCard(r)); });
    }

    function renderAll() {
      var runtime = AHS.SummaryRuntime;
      var records = model
        ? (Array.isArray(model) ? model : [model])
        : (runtime && typeof runtime.list === "function" ? runtime.list() : []);

      filterSlot.innerHTML = "";
      var filter = materialFilter(records, function (materialId) {
        if (!materialId) { renderRecords(records); return; }
        var filtered = runtime && typeof runtime.findByMaterialId === "function"
          ? runtime.findByMaterialId(materialId)
          : records.filter(function (r) { return r.materialId === materialId; });
        renderRecords(filtered, materialId);
      }, initialMaterialId);
      if (filter) { filterSlot.appendChild(filter); }

      /* WO-010/WO-013: a deep link into one material's Summary Detail
         renders findByMaterialId() for that id — even if it's empty (no
         summary yet for that specific material), which correctly shows
         the dedicated "尚未建立學習總結" state (not the generic
         whole-list Empty State, and never a blank screen). */
      if (initialMaterialId) {
        var initial = runtime && typeof runtime.findByMaterialId === "function"
          ? runtime.findByMaterialId(initialMaterialId)
          : records.filter(function (r) { return r.materialId === initialMaterialId; });
        renderRecords(initial, initialMaterialId);
      } else {
        renderRecords(records);
      }
    }

    renderAll();

    return el("div", { class: "sum-page" }, [
      banner(status),
      filterSlot,
      body,
      status
    ]);
  }

  return { create: create };
})();
