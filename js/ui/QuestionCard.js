/* components/QuestionCard.js — Sprint 4 · Quiz Runtime Foundation.
   Renders a single question (stem + 4 options) for the exam-taking
   view. Pure render: takes a question record (as produced by
   AHS.QuestionBank / AHS.QuestionRuntime) plus the currently-saved
   answer key, and an onSelect(key) callback — it never talks to any
   Runtime directly. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionCard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* HOTFIX-004 Issue 002: 難度 for a Repository-sourced question never
     survived into QuestionRuntime's own stored shape (js/runtime/
     TeachingMaterialLoader.js is explicitly protected this Hotfix, so
     that can't be fixed at the source this time) — resolved here
     instead via the same real Repository record, matched by the
     question's own real id (js/ui/MaterialDetailRepositorySource.js,
     already built for Material Detail, reused read-only). question.
     knowledgePoint, by contrast, IS already present directly (Loader
     already carries it) — never overridden. Returns "" (not fabricated)
     when unresolvable, exactly like every other honest-gap field here. */
  function resolveDifficulty(question) {
    if (question.difficulty) { return question.difficulty; }
    if (!question.materialId || !AHS.MaterialDetailRepositorySource ||
        typeof AHS.MaterialDetailRepositorySource.resolve !== "function") { return ""; }
    var repo = AHS.MaterialDetailRepositorySource.resolve(question.materialId);
    if (!repo || !repo.quiz || !Array.isArray(repo.quiz.questions)) { return ""; }
    var match = repo.quiz.questions.filter(function (q) { return q.id === question.id; })[0];
    return match ? (match.difficulty || "") : "";
  }

  /* resolveSection() — same gap/same fix as resolveDifficulty() above:
     TeachingMaterialLoader.js's buildExamCompatibleQuestions()/
     repoExamCompatibleQuestions() reshape never carries a question's own
     `section` field (QuestionBank.schema.json's optional per-question
     節/單元 label, populated from tm_15 onward — see its material.md)
     into QuestionRuntime's stored shape, so it's resolved here the same
     read-only way, via the real Repository record, matched by question
     id. Returns "" (not fabricated) when unresolvable. */
  function resolveSection(question) {
    if (question.section) { return question.section; }
    if (!question.materialId || !AHS.MaterialDetailRepositorySource ||
        typeof AHS.MaterialDetailRepositorySource.resolve !== "function") { return ""; }
    var repo = AHS.MaterialDetailRepositorySource.resolve(question.materialId);
    if (!repo || !repo.quiz || !Array.isArray(repo.quiz.questions)) { return ""; }
    var match = repo.quiz.questions.filter(function (q) { return q.id === question.id; })[0];
    return match ? (match.section || "") : "";
  }

  /* 計算／填充題輸入過的文字（答對時作答 key 只存 SELF_CORRECT，回到這題時用來還原輸入框）。 */
  var typedMemory = {};

  /* create(question, selectedKey, onSelect) */
  function create(question, selectedKey, onSelect) {
    var subj = AHS.Subjects[question.subject];
    var difficulty = resolveDifficulty(question);
    var section = resolveSection(question);
    var metaBits = [];
    if (section) { metaBits.push("章節：" + section); }
    if (difficulty) { metaBits.push("難度：" + difficulty); }
    if (question.knowledgePoint) { metaBits.push("考點：" + question.knowledgePoint); }

    /* 2026-09-30: fixed per-question display order (AHS.OptionOrder);
       data-key / onSelect keep the ORIGINAL key, the visible letter is
       the display position. */
    var displayed = AHS.OptionOrder ? AHS.OptionOrder.order(question) : question.options.map(function (o) {
      return { key: o.key, text: o.text, label: o.key };
    });
    /* 2026-10-08 題型支援（js/utils/QuestionKind.js）。 */
    var kind = AHS.QuestionKind ? AHS.QuestionKind.kindOf(question) : "choice";
    var picked = kind === "multi" ? AHS.QuestionKind.multiKeys(selectedKey) : [];
    var optionButtons = kind === "self" ? [] : displayed.map(function (opt) {
      var isSelected = kind === "multi" ? picked.indexOf(opt.key) !== -1 : selectedKey === opt.key;
      var btn = el("button", {
        type: "button",
        class: "qcard-option" + (isSelected ? " is-selected" : ""),
        "aria-pressed": isSelected ? "true" : "false",
        "data-key": opt.key
      }, [
        el("span", { class: "qcard-option__key", text: opt.label }),
        el("span", { class: "qcard-option__text", text: opt.text })
      ]);
      btn.addEventListener("click", function () {
        if (typeof onSelect !== "function") { return; }
        if (kind === "multi") {
          var next = picked.indexOf(opt.key) === -1 ? picked.concat([opt.key])
            : picked.filter(function (k) { return k !== opt.key; });
          onSelect(next.length ? AHS.QuestionKind.joinKeys(next) : null);
          return;
        }
        onSelect(opt.key);
      });
      return btn;
    });

    /* 計算／填充題（2026-10-27）：同月考選填，每一格輸入答案後按「確定答案」，
       依標準答案自動批改（AHS.QuestionKind.keyForInput）。作答中不顯示答案，
       交卷後才在成績頁看答案與詳解。 */
    var selfBlock = null;
    if (kind === "self") {
      var QK = AHS.QuestionKind;
      var want = QK.parts(QK.answerText(question));
      var prior = selectedKey === QK.SELF_CORRECT ? (typedMemory[question.id] || want)
        : (selectedKey ? String(selectedKey).split("；") : (typedMemory[question.id] || []));
      var inputs = want.map(function (w, i) {
        return el("input", {
          type: "text", class: "qcard-self__input", inputmode: "text", autocomplete: "off",
          "aria-label": want.length > 1 ? "第 " + (i + 1) + " 格答案" : "答案",
          value: prior[i] != null ? prior[i] : ""
        });
      });
      var status = el("p", { class: "qcard-self__status", "aria-live": "polite", text: selectedKey ? "已作答（交卷後公布答案）" : "" });
      var save = function () {
        var typed = inputs.map(function (inp) { return inp.value; });
        typedMemory[question.id] = typed;
        var key = QK.keyForInput(question, typed);
        if (!key) { status.textContent = want.length > 1 ? "每一格都要填答案。" : "請輸入答案。"; return; }
        if (typeof onSelect === "function") { onSelect(key); }
      };
      inputs.forEach(function (inp, i) {
        inp.addEventListener("keydown", function (e) {
          if (e.key !== "Enter") { return; }
          e.preventDefault();
          if (i < inputs.length - 1) { inputs[i + 1].focus(); } else { save(); }
        });
      });
      var saveBtn = el("button", { type: "button", class: "qcard-self__save", text: "確定答案" });
      saveBtn.addEventListener("click", save);
      selfBlock = el("div", { class: "qcard-self" }, [
        /* 2026-11-02 英文單字克漏字：答案是英文單字／片語時，提示改成拼字說明 */
        el("p", { class: "qcard-self__hint", text: want.every(function (w) { return /^[A-Za-z][A-Za-z' -]*$/.test(w); })
          ? "拼出完整的英文單字或片語（大小寫不拘），按「確定答案」。"
          : want.length > 1
            ? "依序在每一格輸入答案（數字可用分數、√、π，例如 2/3、3√2），全部答對才算答對。"
            : "輸入答案（數字可用分數、√、π，例如 2/3、3√2），按「確定答案」。" }),
        el("ol", { class: "qcard-self__fields" }, inputs.map(function (inp, i) {
          return el("li", {}, [want.length > 1 ? el("span", { class: "qcard-self__no", text: "(" + (i + 1) + ")" }) : null, inp]);
        })),
        saveBtn, status
      ]);
    }

    return el("section", { class: "card qcard", "aria-label": "第 " + question.index + " 題" }, [
      el("div", { class: "qcard__head" }, [
        el("span", {
          class: "qcard__badge",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
          text: subj.name
        }),
        el("span", { class: "qcard__index", text: "第 " + question.index + " 題" }),
        el("span", { class: "qcard__type", text: AHS.QuestionKind ? AHS.QuestionKind.typeLabel(question) : question.type })
      ]),
      el("h2", { class: "qcard__text", text: question.text }),
      kind === "multi" ? el("p", { class: "qcard__hint", text: "多選題：選出所有正確的選項（可複選），全部選對才算答對。" }) : null,
      /* 2026-10-01 出處 (past exam / supplement questions) */
      (window.AHS && AHS.QuestionReference ? AHS.QuestionReference.node(question) : null),
      metaBits.length ? el("p", { class: "qcard__meta", text: metaBits.join("　") }) : null,
      /* Sprint AI-147（使用者需求：題目附圖）: real passthrough render
         only — a plain, honest empty (no element at all) when this
         question genuinely has no figureSvg, never a placeholder box. */
      question.figureSvg ? el("div", { class: "qcard__figure", html: question.figureSvg }) : null,
      selfBlock || el("div", { class: "qcard__options" }, optionButtons)
    ]);
  }

  /* createCloze(unit, answers, onSelect) — 2026-11-16 短文式克漏字：一篇短文的所有
     空格（unit = 同一題組的題目，依作答順序）畫成一張卡片，短文只出現一次，每個空格
     內嵌自己的下拉選單（各空格各自 4 選 1）。每一格仍是一題：選擇時呼叫
     onSelect(questionId, key, blankPosition)，key 是該題原本的選項 key。
     answers: { questionId: key }（目前已存的作答）。 */
  function createCloze(unit, answers, onSelect) {
    var CG = AHS.ClozeGroup;
    var first = unit[0];
    var last = unit[unit.length - 1];
    var subj = AHS.Subjects[first.subject];
    var byNumber = {};
    unit.forEach(function (q) { byNumber[CG.parse(q).number] = q; });
    var parsed = CG.parse(first);
    var answered = unit.filter(function (q) { return answers && answers[q.id] != null; }).length;

    var passage = el("p", { class: "qcard-cloze__passage" });
    var position = 0;
    CG.split(parsed.passage).forEach(function (part, i) {
      if (i % 2 === 0) { passage.appendChild(document.createTextNode(part)); return; }
      var q = byNumber[Number(part)];
      if (!q) { passage.appendChild(document.createTextNode("(" + part + ") ______")); return; }
      var displayed = AHS.OptionOrder ? AHS.OptionOrder.order(q) : q.options.map(function (o) {
        return { key: o.key, text: o.text, label: o.key };
      });
      var saved = answers ? answers[q.id] : null;
      var select = el("select", {
        class: "qcard-cloze__select" + (saved != null ? " is-answered" : ""),
        "aria-label": "第 " + part + " 格"
      });
      select.appendChild(el("option", { value: "", text: "(" + part + ") 請選擇" }));
      displayed.forEach(function (opt) {
        var o = el("option", { value: opt.key, text: opt.label + ". " + opt.text });
        if (saved === opt.key) { o.setAttribute("selected", "selected"); }
        select.appendChild(o);
      });
      var pos = position;
      position += 1;
      select.addEventListener("change", function () {
        if (select.value && typeof onSelect === "function") { onSelect(q.id, select.value, pos); }
      });
      passage.appendChild(select);
    });

    /* 出處寫的是教材原本的題號（第 49–56 題為題組）；打亂後卡片標頭是作答順序，
       這裡把出處裡的題號範圍改成跟標頭一樣，才不會同一張卡片出現兩套題號。 */
    var refNode = window.AHS && AHS.QuestionReference ? AHS.QuestionReference.node(first) : null;
    if (refNode) {
      Array.prototype.forEach.call(refNode.childNodes, function (n) {
        if (n.nodeType === 3) { n.nodeValue = n.nodeValue.replace(/第 \d+[–-]\d+ 題為題組/, "第 " + first.index + "～" + last.index + " 題為題組"); }
      });
    }
    return el("section", { class: "card qcard qcard-cloze", "aria-label": "克漏字 第 " + first.index + "～" + last.index + " 題" }, [
      el("div", { class: "qcard__head" }, [
        el("span", {
          class: "qcard__badge",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
          text: subj.name
        }),
        el("span", { class: "qcard__index", text: "第 " + first.index + "～" + last.index + " 題" }),
        el("span", { class: "qcard__type", text: "克漏字（單選）" })
      ]),
      el("h2", { class: "qcard__text", text: "閱讀短文〈" + parsed.title + "〉，在每個空格選出最適合的答案。" }),
      el("p", { class: "qcard__hint qcard-cloze__count", text: "已作答 " + answered + " / " + unit.length + " 格" }),
      passage,
      refNode
    ]);
  }

  return { create: create, createCloze: createCloze };
})();
