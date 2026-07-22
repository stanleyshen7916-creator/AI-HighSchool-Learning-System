/* components/MaterialUploadDialog.js — "新增教材" metadata modal.
   Shown after a file is picked; collects 教材名稱 / 科目 / 年級 /
   教材分類 before the material is created in MaterialRuntime. No inline
   handlers/styles; reuses existing tokens via css classes. Memory only.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialUploadDialog = (function () {
  "use strict";
  var el = AHS.UI.el;

  var SUBJECTS = ["chinese", "english", "math", "physics", "chemistry",
    "biology", "history", "geography", "civics"];
  var GRADES = ["高一", "高二", "高三"];
  var CATEGORIES = ["課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"];

  function selectField(labelText, options, required) {
    var sel = el("select", { class: "mat-dialog__control", "aria-label": labelText },
      [el("option", { value: "", text: "請選擇" })].concat(
        options.map(function (o) {
          return el("option", { value: o.value, text: o.label });
        })
      ));
    return {
      field: el("label", { class: "mat-dialog__field" }, [
        el("span", { class: "mat-dialog__field-label",
          text: labelText + (required ? " *" : "") }),
        sel
      ]),
      control: sel
    };
  }

  /* open(file, onConfirm, onCancel) — file: the picked File; onConfirm
     receives { title, subject, grade, category }. Returns the overlay
     node (caller appends to document). Validates the three required
     fields before confirming. */
  function open(file, onConfirm, onCancel, folders) {
    var defaultName = file && file.name ? file.name.replace(/\.[^.]+$/, "") : "未命名教材";

    var nameInput = el("input", {
      class: "mat-dialog__control", type: "text",
      value: defaultName, "aria-label": "教材名稱"
    });
    var nameField = el("label", { class: "mat-dialog__field" }, [
      el("span", { class: "mat-dialog__field-label", text: "教材名稱" }),
      nameInput
    ]);

    var subjectF = selectField("科目", SUBJECTS.map(function (k) {
      return { value: k, label: AHS.Subjects[k].name };
    }), true);
    var gradeF = selectField("年級", GRADES.map(function (g) {
      return { value: g, label: g };
    }), true);
    var categoryF = selectField("教材分類", CATEGORIES.map(function (c) {
      return { value: c, label: c };
    }), true);

    /* BUG-010-003: optional Folder select. Choosing a folder with a
       defaultCategory pre-fills 教材分類 (user can still change it). */
    var folderList = folders || [];
    var folderF = selectField("資料夾", [{ value: "", label: "未分類" }].concat(
      folderList.map(function (f) { return { value: f.id, label: f.name }; })
    ), false);
    folderF.control.addEventListener("change", function () {
      var fid = folderF.control.value;
      if (!fid) { return; }
      var folder = null;
      for (var i = 0; i < folderList.length; i++) {
        if (folderList[i].id === fid) { folder = folderList[i]; break; }
      }
      if (folder && folder.defaultCategory) {
        categoryF.control.value = folder.defaultCategory;
      }
    });

    var errorMsg = el("p", { class: "mat-dialog__error", role: "alert", hidden: "hidden" });

    var overlay = el("div", { class: "mat-dialog__overlay", role: "dialog", "aria-modal": "true", "aria-label": "新增教材" });

    function close() {
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    }

    var cancelBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--ghost", text: "取消" });
    cancelBtn.addEventListener("click", function () {
      close();
      if (typeof onCancel === "function") { onCancel(); }
    });

    var confirmBtn = el("button", { type: "button", class: "mat-dialog__btn mat-dialog__btn--primary", text: "建立教材" });
    confirmBtn.addEventListener("click", function () {
      var title = nameInput.value.trim() || defaultName;
      var subject = subjectF.control.value;
      var grade = gradeF.control.value;
      var category = categoryF.control.value;
      if (!subject || !grade || !category) {
        errorMsg.textContent = "請完整填寫科目、年級與教材分類。";
        errorMsg.removeAttribute("hidden");
        return;
      }
      close();
      if (typeof onConfirm === "function") {
        onConfirm({
          title: title, subject: subject, grade: grade, category: category,
          folderId: folderF.control.value || null
        });
      }
    });

    /* Click on backdrop cancels. */
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        close();
        if (typeof onCancel === "function") { onCancel(); }
      }
    });

    var dialog = el("div", { class: "mat-dialog" }, [
      el("div", { class: "mat-dialog__head" }, [
        el("h2", { class: "mat-dialog__title", text: "新增教材" }),
        el("p", { class: "mat-dialog__sub", text: file && file.name ? file.name : "" })
      ]),
      el("div", { class: "mat-dialog__body" }, [
        nameField, subjectF.field, gradeF.field, categoryF.field, folderF.field, errorMsg
      ]),
      el("div", { class: "mat-dialog__foot" }, [cancelBtn, confirmBtn])
    ]);

    overlay.appendChild(dialog);
    return overlay;
  }

  return { open: open };
})();
