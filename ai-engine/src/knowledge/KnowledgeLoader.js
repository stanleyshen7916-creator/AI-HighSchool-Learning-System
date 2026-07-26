/* ai-engine/src/knowledge/KnowledgeLoader.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Material Runtime Integration)
   Turns a plain object, a JSON string, or an AHS.MaterialRuntime record
   into a normalized, frozen knowledge record. No extraction/parsing/
   summarization business logic — this only reshapes data the caller
   (or MaterialRuntime) already has.

   loadFromMaterial()/loadAllFromMaterialRuntime() read
   AHS.MaterialRuntime strictly through its existing public getById()/
   list() — never written to, never modified. If MaterialRuntime is not
   on the page (this layer isn't wired into any HTML page yet), these
   two methods throw a clear ValidationError rather than a raw
   TypeError; loadFromObject/loadFromJSON/normalize are unaffected and
   still work with no Runtime present at all. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeLoader() {}

  KnowledgeLoader.prototype.normalize = function (value) {
    if (!AHS.AIEngine.Utilities.isPlainObject(value)) {
      throw new AHS.AIEngine.ValidationError(
        "KnowledgeLoader.normalize requires a plain object"
      );
    }
    var copy = {};
    Object.keys(value).forEach(function (key) {
      copy[key] = value[key];
    });
    return AHS.AIEngine.Utilities.freeze(copy);
  };

  KnowledgeLoader.prototype.loadFromObject = function (value) {
    return this.normalize(value);
  };

  KnowledgeLoader.prototype.loadFromJSON = function (jsonString) {
    var parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new AHS.AIEngine.ValidationError("Invalid JSON: " + e.message);
    }
    return this.loadFromObject(parsed);
  };

  function assertMaterialRuntime(method) {
    if (
      typeof window === "undefined" ||
      !window.AHS ||
      !AHS.MaterialRuntime ||
      typeof AHS.MaterialRuntime[method] !== "function"
    ) {
      throw new AHS.AIEngine.ValidationError(
        "AHS.MaterialRuntime is not available (KnowledgeLoader." + method + "-backed load)"
      );
    }
  }

  /* EO-AI-004: build a Knowledge Object from one Material Runtime
     record, read-only via getById(). */
  KnowledgeLoader.prototype.loadFromMaterial = function (materialId) {
    assertMaterialRuntime("getById");
    var material = AHS.MaterialRuntime.getById(materialId);
    if (!material) {
      throw new AHS.AIEngine.ValidationError("Material not found: " + materialId);
    }
    var metadata = new AHS.AIEngine.MetadataBuilder().fromMaterial(material).build();
    return this.normalize({
      id: "kn_" + material.id,
      materialId: material.id,
      metadata: metadata,
      content: material.content || ""
    });
  };

  /* EO-AI-004: build a Knowledge Object for every Material Runtime
     record, read-only via list(). */
  KnowledgeLoader.prototype.loadAllFromMaterialRuntime = function () {
    assertMaterialRuntime("list");
    var self = this;
    return AHS.MaterialRuntime.list().map(function (material) {
      return self.loadFromMaterial(material.id);
    });
  };

  AHS.AIEngine.KnowledgeLoader = KnowledgeLoader;
})();
