/* js/ui.js — minimal DOM helper shared via window.AHS namespace. */
window.AHS = window.AHS || {};
AHS.UI = (function () {
  "use strict";

  /* el(tag, attrs, children) — create an element.
     attrs: { class, text, html, onclick, ...otherAttributes }
     children: array of nodes/strings (appended after text/html). */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var val = attrs[key];
      if (val == null) { return; }
      if (key === "class") { node.className = val; }
      else if (key === "text") { node.textContent = val; }
      else if (key === "html") { node.innerHTML = val; }
      else if (key === "onclick") { node.addEventListener("click", val); }
      else { node.setAttribute(key, val); }
    });
    (children || []).forEach(function (child) {
      if (child == null) { return; }
      node.appendChild(typeof child === "string"
        ? document.createTextNode(child) : child);
    });
    return node;
  }

  function mount(parent, node) {
    parent.innerHTML = "";
    parent.appendChild(node);
    return node;
  }

  return { el: el, mount: mount };
})();
