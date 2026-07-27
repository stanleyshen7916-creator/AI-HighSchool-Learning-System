/* ai-engine/src/knowledge/MetadataBuilder.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Normalize / Complete Missing Fields)
   EO-AI-012E · Summary Metadata Migration (title field)
   Fluent builder producing a Metadata instance. No business logic —
   pure data assembly and field mapping.

   "Complete Missing Fields" is handled by the underlying Metadata
   constructor itself (any field not passed to build() already defaults
   to null) — fromMaterial() only adds the "Normalize" responsibility:
   mapping a raw AHS.MaterialRuntime record's fields onto their Metadata
   equivalents. It never reads AHS.MaterialRuntime itself (the caller,
   KnowledgeLoader, is the only place that touches the Runtime).

   EO-AI-012E: maps material.title -> metadata.title, same structural
   pass-through as subject/grade/chapter above it — not AI-generated,
   null when the material has none. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function MetadataBuilder() {
    this._values = {};
  }

  MetadataBuilder.prototype.set = function (field, value) {
    if (AHS.AIEngine.Metadata.FIELDS.indexOf(field) === -1) {
      throw new AHS.AIEngine.ValidationError("Unknown metadata field: " + field);
    }
    this._values[field] = value;
    return this;
  };

  MetadataBuilder.prototype.fromMaterial = function (material) {
    if (!AHS.AIEngine.Utilities.isPlainObject(material)) {
      throw new AHS.AIEngine.ValidationError(
        "MetadataBuilder.fromMaterial requires a plain object"
      );
    }
    this.set("id", material.id ? "md_" + material.id : null);
    this.set("materialId", material.id || null);
    this.set("title", material.title || null);
    this.set("subject", material.subject || null);
    this.set("grade", material.grade || null);
    this.set("chapter", material.chapter || null);
    this.set("tags", []);
    this.set("createdAt", material.date || null);
    this.set("updatedAt", material.date || null);
    return this;
  };

  MetadataBuilder.prototype.build = function () {
    return new AHS.AIEngine.Metadata(this._values);
  };

  AHS.AIEngine.MetadataBuilder = MetadataBuilder;
})();
