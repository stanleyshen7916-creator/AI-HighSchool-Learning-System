/* ai-engine/src/knowledge/MetadataBuilder.js — EO-AI-003 · Knowledge Engine Foundation
   Fluent builder producing a Metadata instance. No business logic —
   pure data assembly. */
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

  MetadataBuilder.prototype.build = function () {
    return new AHS.AIEngine.Metadata(this._values);
  };

  AHS.AIEngine.MetadataBuilder = MetadataBuilder;
})();
