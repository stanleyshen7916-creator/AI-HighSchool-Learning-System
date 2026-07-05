/* js/Icons.js — shared inline SVG icon set + subject metadata.
   Line icons (stroke, currentColor) keep the UI consistent without any
   external image assets, so everything works over file://.
   Exposed as AHS.Icons.<name>() -> svg string, and AHS.Subjects. */
window.AHS = window.AHS || {};

AHS.Subjects = {
  chinese: { name: "國文", varName: "--subj-chinese", hex: "#6366f1" },
  english: { name: "英文", varName: "--subj-english", hex: "#22b573" },
  math: { name: "數學", varName: "--subj-math", hex: "#7c5cff" },
  physics: { name: "物理", varName: "--subj-physics", hex: "#f59e0b" },
  chemistry: { name: "化學", varName: "--subj-chemistry", hex: "#3b82f6" },
  biology: { name: "生物", varName: "--subj-biology", hex: "#10b981" },
  history: { name: "歷史", varName: "--subj-history", hex: "#ef4444" },
  geography: { name: "地理", varName: "--subj-geography", hex: "#06b6d4" },
  civics: { name: "公民", varName: "--subj-civics", hex: "#ec4899" }
};

AHS.Icons = (function () {
  "use strict";

  function svg(paths, extra) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" xmlns="http://www.w3.org/2000/svg"' +
      (extra ? " " + extra : "") + ">" + paths + "</svg>"
    );
  }

  var reg = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
    quiz: '<path d="M9 4h9a2 2 0 0 1 2 2v14l-4-2-4 2-4-2V6a2 2 0 0 1 2-2z"/><path d="M9 9h6M9 13h4"/>',
    wrong: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    summary: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    learning: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    dashboard: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z"/>',
    tutor: '<circle cx="12" cy="8" r="4"/><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 12H3M6 8l-4 4 4 4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    chat: '<path d="M4 5h16v11H9l-4 3z"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    download: '<path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14"/>',
    camera: '<path d="M4 8h4l2-2h4l2 2h4v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-1 5"/><path d="M20 4v5h-5"/>',
    aa: '<path d="M4 18l4-11 4 11M5.5 14h5"/><path d="M14 18l3-8 3 8M15 15h4"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    heart: '<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5c0 5-7 9.5-7 9.5z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'
  };

  var api = {};
  Object.keys(reg).forEach(function (key) {
    api[key] = (function (paths) {
      return function (extra) { return svg(paths, extra); };
    })(reg[key]);
  });
  return api;
})();
