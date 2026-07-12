/* components/MaterialFolder.js — Folder container UI (BUG-010).
   Provides (1) the "新增資料夾" dialog and (2) the left-sidebar folder
   list. Folder = Material Container; this file only builds UI and calls
   back to the integrator (MaterialCenter), which owns MaterialRuntime.
   No inline handlers/styles; memory only. PascalCase under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialFolder = (function () {
  "use strict";
  var el = AHS.UI.el;

  var SUBJECTS = ["chinese", "english", "math", "physics", "chemistry",
    "biology", "history", "geography", "civics"];
  var GRADES = ["高一", "高二", "高三"];
  var CATEGORIES = ["課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"];

  function selectField(labelText, options, required, includeBlank, blankLabel) {
    var opts = [];
    if (includeBlank) { opts.push(el("option", { value: "", text: blankLabel || "請選擇" })); }
    options.forEach(function (o) { opts.push(el("option", { value: o.value, text: o.label })); });
    var sel = el("select", { class: "mat-dialog__control", "aria-label": labelText }, opts);
    return {
      field: el("label", { class: "mat-dialog__field" }, [
        el("span", { class: "mat-dialog__field-label", text: labelText + (required ? " *" : "") }),
        sel
      ]),
      control: sel
    };
  }

  /* openDialog(onConfirm, onCancel) — "新增資料夾" modal. onConfirm gets
     { name, subject, grade, defaultCategory }. Validates 3 required
     fields. Returns the overlay node (caller appends to document). */
  function openDialog(onConfirm, onCancel) {
    var nameInput = el("input", { class: "mat-dialog__control", type: "text", "aria-label": "資料夾名稱" });
    var nameField = el("label", { class: "mat-dialog__field" }, [
      el("span", { class: "mat-dialog__field-label", text: "資料夾名稱 *" }),
      nameInput
    ]);

    var subjectF = selectField("科目", SUBJECTS.map(function (k) {
      return { value: k, label: AHS.Subjects[k].name };
    }), true, true);
    var gradeF = selectField("年級", GRADES.map(function (g) {
      return { value: g, label: g };
    }), true, true);
    var categoryF = selectField("預設教材分類", CATEGORIES.map(function (c) {
      return { value: c, label: c };
    }), false, true, "無");

    var errorMsg = el("p", { class: "mat-dialog__error", role: "alert", hidden: "hidden" });
    var overlay = el("div", { class: "mat-dialog__overlay", role: "dialog", "aria-modal": "true", "aria-label": "新增資料夾" });
    function close() { if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); } }

    var cancelBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "取消" });
    cancelBtn.addEventListener("click", function () { close(); if (typeof onCancel === "function") { onCancel(); } });

    var confirmBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--primary", text: "建立" });
    confirmBtn.addEventListener("click", function () {
      var name = nameInput.value.trim();
      var subject = subjectF.control.value;
      var grade = gradeF.control.value;
      var defaultCategory = categoryF.control.value;
      if (!name || !subject || !grade) {
        errorMsg.textContent = "請完整填寫資料夾名稱、科目與年級。";
        errorMsg.removeAttribute("hidden");
        return;
      }
      close();
      if (typeof onConfirm === "function") {
        onConfirm({ name: name, subject: subject, grade: grade, defaultCategory: defaultCategory });
      }
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) { close(); if (typeof onCancel === "function") { onCancel(); } }
    });

    overlay.appendChild(el("div", { class: "mat-dialog" }, [
      el("div", { class: "mat-dialog__head" }, [
        el("h2", { class: "mat-dialog__title", text: "新增資料夾" })
      ]),
      el("div", { class: "mat-dialog__body" }, [
        nameField, subjectF.field, gradeF.field, categoryF.field, errorMsg
      ]),
      el("div", { class: "mat-dialog__foot" }, [cancelBtn, confirmBtn])
    ]));
    return overlay;
  }

  /* renderList(folders, opts) — left-sidebar folder list.
     opts = { activeId, onPick(id|null), onDelete(id), countOf(id) }.
     Includes an "全部資料夾" and "未分類" entry. */
  function renderList(folders, opts) {
    opts = opts || {};
    var activeId = opts.activeId || "all";

    function row(id, label, count, deletable) {
      var btn = el("button", {
        type: "button",
        class: "mat-folder__item" + (activeId === id ? " is-active" : ""),
        "data-folder-id": id === null ? "none" : id
      }, [
        el("span", { class: "mat-folder__icon", "aria-hidden": "true", html: AHS.Icons.book() }),
        el("span", { class: "mat-folder__name", text: label }),
        (typeof count === "number"
          ? el("span", { class: "mat-folder__count", text: String(count) })
          : null)
      ]);
      btn.addEventListener("click", function () {
        if (typeof opts.onPick === "function") { opts.onPick(id); }
      });

      if (deletable && typeof opts.onDelete === "function") {
        var del = el("button", {
          type: "button", class: "mat-folder__del", "aria-label": "刪除資料夾",
          "data-tip": "刪除資料夾", html: AHS.Icons.filterX()
        });
        del.addEventListener("click", function (e) {
          e.stopPropagation();
          opts.onDelete(id);
        });
        var wrap = el("div", { class: "mat-folder__row" }, [btn, del]);
        return wrap;
      }
      return el("div", { class: "mat-folder__row" }, [btn]);
    }

    var items = [
      row("all", "全部資料夾", null, false),
      row(null, "未分類",
        typeof opts.countOf === "function" ? opts.countOf(null) : undefined, false)
    ];
    folders.forEach(function (f) {
      items.push(row(f.id, f.name,
        typeof opts.countOf === "function" ? opts.countOf(f.id) : undefined, true));
    });

    return el("section", { class: "mat-folder", "aria-label": "資料夾" }, [
      el("h2", { class: "mat-folder__title", text: "資料夾" }),
      el("div", { class: "mat-folder__list" }, items)
    ]);
  }

  /* folderOptions(folders) — [{value,label}] for the upload dialog's
     folder select (BUG-010-003), with a leading 未分類 option. */
  function folderOptions(folders) {
    return [{ value: "", label: "未分類" }].concat(
      folders.map(function (f) { return { value: f.id, label: f.name }; })
    );
  }

  return { openDialog: openDialog, renderList: renderList, folderOptions: folderOptions };
})();
