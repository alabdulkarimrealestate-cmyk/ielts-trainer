/* config.js — builds the rule registry FROM registered modules.
   ENGINE code: never edit this to add content — drop a module file in
   data/modules/ and list it in data/modules/_index.js instead. */
(function () {
  "use strict";

  var modules = window.MODULES || [];

  // ---- rule registry (each rule tracked INDEPENDENTLY, never bundled) ----
  window.RULES = [];
  window.RULE_MAP = {};
  window.RULE_MODULE = {};   // ruleId -> its module object

  modules.forEach(function (m) {
    (m.rules || []).forEach(function (r) {
      if (window.RULE_MAP[r.id]) return; // first registration wins
      window.RULES.push(r);
      window.RULE_MAP[r.id] = r;
      window.RULE_MODULE[r.id] = m;
    });
  });

  window.ruleLabel = function (id) { return (window.RULE_MAP[id] || {}).label || id; };

  // effective drill mode of a rule: "active" | "maintenance" | "background"
  window.ruleMode = function (ruleId) {
    var m = window.RULE_MODULE[ruleId];
    return (m && m.mode) || "active";
  };

  window.moduleById = function (id) {
    for (var i = 0; i < modules.length; i++)
      if (modules[i].module_id === id) return modules[i];
    return null;
  };

  window.stageForRule = function (ruleId) {
    var m = window.RULE_MODULE[ruleId];
    return m ? m.stage_id : null;
  };

  // ---- flat item pool ----
  window.ALL_ITEMS = [];
  modules.forEach(function (m) {
    (m.items || []).forEach(function (i) { window.ALL_ITEMS.push(i); });
  });

  window.itemMode = function (item) { return item.mode || "mc"; };

  window.itemsForRule = function (ruleId) {
    return window.ALL_ITEMS.filter(function (i) { return i.rule === ruleId; });
  };

  // rules whose stress cards carry the "read aloud now" bridge reminder
  window.READ_ALOUD_RULES = {};
  modules.forEach(function (m) {
    (m.read_aloud_rules || []).forEach(function (r) { window.READ_ALOUD_RULES[r] = true; });
  });
})();
