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
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* HOTFIX-005 AI-503/AI-504: sections a real Summary Runtime record
     already has, reshaped into AHS.DocumentExport's block model — real
     content only, "（無資料）" (never fabricated) when a section is
     genuinely empty. Shared by both 下載總結 (PDF, via browser print) and
     匯出筆記 (Markdown) so their output always matches exactly. */
  function summaryExportBlocks(records) {
    var blocks = [];
    (records || []).forEach(function (record) {
      blocks.push({ heading: "《" + (record.title || record.materialId || "教材") + "》", kind: "title" });
      blocks.push({ heading: "① 核心概念", lines: record.coreConcepts || [] });
      blocks.push({ heading: "② 重要定義／公式／關鍵字", lines: record.definitions || [] });
      blocks.push({ heading: "③ 易錯與常考題型", lines: record.pitfalls || [] });
      blocks.push({ heading: "④ 必背重點", lines: record.memorize || [] });
      blocks.push({ heading: "⑤ 複習建議", lines: deriveReviewSuggestions(record) });
    });
    return blocks;
  }

  /* ---- Banner ------------------------------------------------------------
     getRecords(): returns whatever summary record(s) are CURRENTLY shown
     below (respecting the 篩選教材 filter) — export always matches what
     the user is actually looking at, never a hidden/different set. */
  function banner(status, getRecords) {
    function exportBtn(cls, icon, label, sub, onExport) {
      var b = el("button", { type: "button", class: "sum-export " + cls }, [
        el("span", { class: "sum-export__icon", html: AHS.Icons[icon]() }),
        el("span", { class: "sum-export__text" }, [
          el("strong", { text: label }),
          el("small", { text: sub })
        ])
      ]);
      b.addEventListener("click", function () {
        var records = (typeof getRecords === "function" ? getRecords() : []) || [];
        if (!records.length) {
          status.textContent = "目前沒有可匯出的學習總結，請先上傳教材並產生總結。";
          status.removeAttribute("hidden");
          return;
        }
        onExport(records);
      });
      return b;
    }
    return el("div", { class: "sum-banner" }, [
      el("div", { class: "sum-banner__titles" }, [
        el("h1", { class: "sum-banner__title", text: "學習總結" }),
        el("p", { class: "sum-banner__subtitle", text: "依教材自動整理的核心概念、定義與複習重點" })
      ]),
      el("div", { class: "sum-banner__actions" }, [
        exportBtn("sum-export--primary", "download", "下載總結", "PDF", function (records) {
          if (!AHS.DocumentExport || typeof AHS.DocumentExport.printBlocks !== "function") { return; }
          AHS.DocumentExport.printBlocks("學習總結", summaryExportBlocks(records));
          status.textContent = "已產生學習總結內容，請於列印視窗選擇「另存為 PDF」完成下載。";
          status.removeAttribute("hidden");
        }),
        exportBtn("sum-export--ghost", "bookmark", "匯出筆記", "Markdown", function (records) {
          if (!AHS.DocumentExport || typeof AHS.DocumentExport.buildMarkdownText !== "function") { return; }
          var text = AHS.DocumentExport.buildMarkdownText("學習總結", summaryExportBlocks(records));
          var blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
          AHS.DocumentExport.downloadBlob(blob, "學習總結.md");
          status.textContent = "已匯出筆記（Markdown）。";
          status.removeAttribute("hidden");
        })
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
     — shown as an honest "尚無資料", never invented.

     Sprint 6.7-1 (AI Summary Experience): each section now has a
     consistent Header + Icon + Divider + Content structure, and an
     optional Badge (⭐常考 / ⚠️易錯 / 🔑關鍵). Badges are NOT a new data
     field on the Summary Runtime record — they're a fixed, honest label
     on the SECTION ITSELF, matching what that section has always meant
     since SummaryGenerator.js defined the five-section format (EO-S6-003):
     every item under "易錯重點" is inherently error-prone by definition,
     every item under "核心概念" is inherently key, and "複習建議" is
     inherently what's recommended to prioritize (⭐常考). "重要定義" and
     "必背內容" get no badge — there's no equally direct semantic mapping
     for those two, and inventing one would be exactly the kind of
     unsupported classification this task's "不得使用假資料" rules out. */
  var SECTION_BADGES = {
    coreConcepts: { icon: "🔑", label: "關鍵" },
    pitfalls: { icon: "⚠️", label: "易錯" },
    reviewSuggestions: { icon: "⭐", label: "常考" }
  };

  function sectionBadge(key) {
    var b = SECTION_BADGES[key];
    if (!b) { return null; }
    return el("span", { class: "sum-badge" }, [
      el("span", { class: "sum-badge__icon", text: b.icon }),
      el("span", { text: b.label })
    ]);
  }

  /* 重點關鍵字標示: every section item is already either a plain sentence
     or a Repository-derived "關鍵字：說明" string (see
     js/runtime/TeachingMaterialLoader.js's own coreConcepts/commonMistakes
     flattening) — when the full-width colon separator is present, the
     part before it IS the real keyword the record itself identified, not
     an invented one. Splitting it out to render in red only makes an
     already-real distinction visible; sentences with no such separator
     render exactly as before. */
  function splitKeyword(text) {
    var s = String(text || "");
    var idx = s.indexOf("：");
    if (idx <= 0 || idx > 24) { return null; }
    return { keyword: s.slice(0, idx), rest: s.slice(idx) };
  }

  function keywordText(text) {
    var parts = splitKeyword(text);
    if (!parts) { return [el("span", { text: String(text) })]; }
    return [
      el("span", { class: "sum-kp__keyword", text: parts.keyword }),
      el("span", { text: parts.rest })
    ];
  }

  function sectionList(sectionKey, icon, title, items) {
    var badge = sectionBadge(sectionKey);
    var body = (items && items.length)
      ? el("ol", { class: "sum-kp__list" }, items.map(function (text, i) {
          return el("li", { class: "sum-kp__item" }, [
            el("span", { class: "sum-kp__num", text: String(i + 1) }),
            el("span", { class: "sum-kp__text" }, keywordText(text))
          ]);
        }))
      : el("p", { class: "sum-section__empty", text: "尚無資料" });

    return el("section", { class: "card sum-section", "aria-label": title }, [
      el("div", { class: "sum-section__head" }, [
        el("span", { class: "sum-ai__spark", html: AHS.Icons[icon]() }),
        el("h2", { class: "sum-section__title", text: title }),
        badge
      ]),
      el("hr", { class: "sum-section__divider" }),
      body
    ]);
  }

  /* ---- 巧巧老師導讀 (Sprint 6.7-1) ----------------------------------------
     Collapsible guide card at the top of a Summary Detail. Every line is
     computed from the record's own real fields/counts — no fabricated
     advice, no Lorem, no placeholder. If the record has no content in
     any section yet, this honestly says so instead of inventing tips. */
  function guideCard(record) {
    var counts = {
      coreConcepts: (record.coreConcepts || []).length,
      definitions: (record.definitions || []).length,
      pitfalls: (record.pitfalls || []).length,
      memorize: (record.memorize || []).length,
      reviewSuggestions: (record.reviewSuggestions || []).length
    };
    var totalItems = counts.coreConcepts + counts.definitions + counts.pitfalls + counts.memorize + counts.reviewSuggestions;

    var highlightParts = [];
    if (counts.coreConcepts) { highlightParts.push(counts.coreConcepts + " 個核心概念"); }
    if (counts.pitfalls) { highlightParts.push(counts.pitfalls + " 個易錯重點"); }
    if (counts.memorize) { highlightParts.push(counts.memorize + " 項必背內容"); }
    /* Task 003 (PMO ruling): the no-content branch uses the mandated
       analyzing-state wording — never「尚未有具體內容」-style copy, and
       never fabricated highlights. */
    var highlightText = highlightParts.length
      ? "《" + (record.title || "本教材") + "》整理了 " + highlightParts.join("、") + "。"
      : "《" + (record.title || "本教材") + "》AI 正在分析教材，尚未取得可整理內容，完成分析後將自動更新。";

    var reminderText;
    if (counts.pitfalls > 0) {
      reminderText = "本教材有 " + counts.pitfalls + " 個易錯重點，複習時請特別留意。";
    } else if (totalItems === 0) {
      reminderText = "教材分析完成前，暫無提醒事項；完成分析後將自動更新。";
    } else {
      reminderText = "目前沒有標記易錯重點，可依複習建議安排學習節奏。";
    }

    var body = el("div", { class: "sum-guide__body" }, [
      el("div", { class: "sum-guide__row" }, [
        el("strong", { class: "sum-guide__row-label", text: "今日教材重點" }),
        el("p", { class: "sum-guide__row-text", text: highlightText })
      ]),
      el("div", { class: "sum-guide__row" }, [
        el("strong", { class: "sum-guide__row-label", text: "建議閱讀順序" }),
        el("p", { class: "sum-guide__row-text", text: "核心概念 → 重要定義 → 易錯重點 → 必背內容 → 複習建議" })
      ]),
      el("div", { class: "sum-guide__row" }, [
        el("strong", { class: "sum-guide__row-label", text: "提醒事項" }),
        el("p", { class: "sum-guide__row-text", text: reminderText })
      ])
    ]);

    var toggleBtn = el("button", {
      type: "button", class: "sum-guide__toggle", "aria-expanded": "true", "aria-label": "收合巧巧老師導讀"
    }, [el("span", { html: AHS.Icons.chevronRight('style="transform:rotate(90deg)"') })]);

    toggleBtn.addEventListener("click", function () {
      var expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
      toggleBtn.setAttribute("aria-label", expanded ? "展開巧巧老師導讀" : "收合巧巧老師導讀");
      toggleBtn.querySelector("span").innerHTML = AHS.Icons.chevronRight(
        expanded ? "" : 'style="transform:rotate(90deg)"'
      );
      body.hidden = expanded;
    });

    return el("section", { class: "card sum-guide", "aria-label": "巧巧老師導讀" }, [
      el("div", { class: "sum-guide__head" }, [
        el("div", {
          class: "sum-guide__avatar qiaoqiao-bust qiaoqiao-bust--sm",
          html: AHS.Qiaoqiao.bust("thinking")
        }),
        el("h2", { class: "sum-guide__title", text: "巧巧老師導讀" }),
        toggleBtn
      ]),
      body
    ]);
  }

  /* ---- Summary Footer (Sprint 6.7-1, reworked Sprint AI-118 AI-118-05)
     已閱讀完成 — a real, working UI toggle scoped to this render only
     (no new Runtime/Storage; SummaryRuntime's Schema/API is untouched,
     per this task's explicit "不得新增 Runtime"). 前往考前練習 (renamed
     from 開始 AI 練習, href unchanged) — a real link into the existing
     non-graded Practice Mode (quiz.html?mode=practice&materialId=...,
     AHS.LearningQuestionRuntime-backed, never writes WrongBook/History
     — confirmed by reading js/components/QuizCenter.js's own
     buildPracticeQuestionView(), untouched here). 前往正式測驗 removed
     and replaced with 前往知識弱點 (AI-118-05: Summary's own CTA set is
     now 前往考前練習/前往知識弱點 only — 正式測驗 is reached from Quiz
     Center itself, matching AI-118-01's Learning Loop where Summary's
     only forward step is practice, not a second formal-exam entry
     point). AI 自動出題 — still explicitly Disabled + Coming Soon,
     unaffected by this Sprint (not named in AI-118-05's removal list). */
  function summaryFooter(record) {
    var readBtn = el("button", { type: "button", class: "sum-footer__read" }, [
      el("span", { html: AHS.Icons.check() }),
      el("span", { text: "標記已閱讀完成" })
    ]);
    var readDone = false;
    readBtn.addEventListener("click", function () {
      readDone = !readDone;
      readBtn.classList.toggle("is-done", readDone);
      readBtn.querySelector("span:last-child").textContent = readDone ? "已閱讀完成" : "標記已閱讀完成";
    });

    /* Sprint 6.8 EO-S6.8-001 (Task 001/002): real navigation into
       Practice Mode, filtered to this material — completes the Material
       → AI Summary → Practice flow. Practice Mode itself (untouched
       here) shows the honest Empty State if this material has no real
       LearningQuestionRuntime records yet; never a fabricated question. */
    var practiceLink = el("a", {
      class: "sum-footer__quiz",
      href: "quiz.html?mode=practice&materialId=" + encodeURIComponent(record.materialId || "")
    }, [
      el("span", { text: "前往考前總複習" }),
      el("span", { html: AHS.Icons.chevronRight() })
    ]);

    /* AI-118-05: 前往知識弱點 replaces 前往正式測驗 — no materialId filter
       param exists on wrongbook.html (confirmed: AppWrongBook.js reads
       no query params), so this links to the page itself; its own
       filter bar already lets a student narrow by 科目/知識點 if needed. */
    var wrongBookLink = el("a", { class: "sum-footer__wrongbook", href: "wrongbook.html" }, [
      el("span", { text: "前往知識弱點" })
    ]);

    /* On-demand AI question GENERATION (as opposed to navigating to see
       whatever already exists) is a distinct, not-yet-built capability
       — per the existing roadmap (Sprint 6.7-2 AI Question Guide /
       6.7-3 Question Generator + AI Parser). Honestly Coming Soon,
       never a Mock Question. */
    var aiGenerateEntry = el("button", {
      type: "button", class: "sum-footer__ai is-disabled", disabled: "disabled",
      "aria-label": "AI 自動出題（尚未支援，敬請期待）"
    }, [
      el("span", { text: "AI 自動出題" }),
      el("span", { class: "ml-tab__soon", text: "Coming Soon" })
    ]);

    return el("div", { class: "sum-footer" }, [readBtn, practiceLink, wrongBookLink, aiGenerateEntry]);
  }

  /* HOTFIX-004 Issue 001: ⑤ 複習建議 derivation, used only when
     record.reviewSuggestions (SummaryRuntime's own, real field — never
     modified here) is genuinely empty. Never calls an AI, never re-
     analyses the material, never waits for a button — reads only fields
     record ALREADY has (coreConcepts/memorize/pitfalls/chapter/section),
     which themselves already came from the Teaching Material Repository
     (via TeachingMaterialLoader.js, HOTFIX-002) — no new Repository
     lookup, no new file, no fabricated content. If reviewSuggestions is
     already real (any future Repository/EO populates it directly), that
     wins unconditionally; if the record has no underlying data at all
     either (the honest Stub-pipeline pending state), this returns []
     and the existing "尚無資料" rendering is untouched. */
  function deriveReviewSuggestions(record) {
    if (Array.isArray(record.reviewSuggestions) && record.reviewSuggestions.length) {
      return record.reviewSuggestions;
    }
    var suggestions = [];

    var order = [record.chapter, record.section].filter(Boolean).join("→");
    if (order) {
      suggestions.push("建議閱讀順序：先複習「" + order + "」的內容，再依序進行後續章節。");
    }

    var coreCount = Array.isArray(record.coreConcepts) ? record.coreConcepts.length : 0;
    var memorizeCount = Array.isArray(record.memorize) ? record.memorize.length : 0;
    if (coreCount || memorizeCount) {
      var parts = [];
      if (coreCount) { parts.push(coreCount + " 個核心概念"); }
      if (memorizeCount) { parts.push(memorizeCount + " 項必背重點"); }
      suggestions.push("建議複習方式：本教材整理了" + parts.join("、") +
        "，建議先閱讀重點整理，再搭配練習題確認理解程度。");
    }

    if (Array.isArray(record.pitfalls) && record.pitfalls.length) {
      suggestions.push("建議注意事項：" + record.pitfalls.slice(0, 3).join("；"));
    }

    return suggestions;
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

    var fiveSections = [
      { key: "coreConcepts", icon: "sparkle", title: "① 核心概念" },
      { key: "definitions", icon: "summary", title: "② 重要定義／公式／關鍵字" },
      { key: "pitfalls", icon: "wrong", title: "③ 易錯與常考題型" },
      { key: "memorize", icon: "bookmark", title: "④ 必背重點" },
      { key: "reviewSuggestions", icon: "refresh", title: "⑤ 複習建議" }
    ];
    /* Sprint 6.6 Round 3 (WO-013, Issue #024) fix, preserved here: a real
       Summary record whose five sections are ALL genuinely empty (no
       real Knowledge content extracted yet — an honest Stub-pipeline
       state, not a bug) gets ONE clear explanatory block instead of
       five repetitive "尚無資料" sections. If ANY section has real
       content, each of the five renders individually (with Section
       Header/Icon/Divider/Badge per this task's Section UI spec). */
    var anyContent = fiveSections.some(function (s) {
      return Array.isArray(record[s.key]) && record[s.key].length;
    });

    var effectiveReviewSuggestions = deriveReviewSuggestions(record);

    var sections;
    if (anyContent) {
      sections = el("div", { class: "sum-section-grid" },
        fiveSections.map(function (s) {
          var content = s.key === "reviewSuggestions" ? effectiveReviewSuggestions : record[s.key];
          return sectionList(s.key, s.icon, s.title, content);
        }));
    } else {
      /* Sprint 6.8 EO-S6.8-002 Task 003 (PAT Critical, PMO ruling):
         Parser 尚未完成解析時的 Pending State 固定顯示這三句 —— 不得
         Placeholder、不得虛構五段式內容。渲染邏輯本身不變：一旦
         Parser 在未來 EO 產出真實內容、Summary Runtime record 的五段
         陣列有值，上方 anyContent 分支就會自動改走五段式真實呈現，
         此區塊自然消失（「完成分析後將自動更新」即由此保證）。 */
      sections = el("section", { class: "card sum-section sum-section--pending", "aria-label": "學習總結分析中" }, [
        el("p", { class: "sum-section__pending", text: "AI 正在分析教材" }),
        el("p", { class: "sum-section__pending-hint", text: "尚未取得可整理內容" }),
        el("p", { class: "sum-section__pending-hint", text: "完成分析後將自動更新" })
      ]);
    }

    return el("div", { class: "sum-record" }, [
      head,
      guideCard(record),
      sections,
      summaryFooter(record)
    ]);
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
    /* HOTFIX-005 AI-503/AI-504: whatever is CURRENTLY rendered in `body`
       (respecting 篩選教材) is exactly what 下載總結／匯出筆記 export —
       kept in sync by renderRecords(), the single place `body` changes. */
    var currentRecords = [];

    function renderRecords(records, forMaterialId) {
      currentRecords = records || [];
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
      banner(status, function () { return currentRecords; }),
      filterSlot,
      body,
      status
    ]);
  }

  return { create: create };
})();
