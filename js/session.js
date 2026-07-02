/* session.js — builds drill queues and runs them through Drills to a summary. */
(function () {
  "use strict";

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Weight a rule by weakness: unknown/low-accuracy rules get more items.
  function ruleWeight(ruleId) {
    var acc = Store.recentAccuracy(ruleId); // 0..1 or null
    if (acc === null) return 3.0;           // never practiced -> prioritise
    return (1 - acc) * 3 + 0.5;             // weakest first, floor 0.5
  }

  // Build a mixed set of `count` items weighted toward weakest rules.
  function buildSession(count) {
    count = count || 15;
    var rules = window.RULES.map(function (r) { return r.id; });
    var weights = {};
    rules.forEach(function (id) { weights[id] = ruleWeight(id); });

    var queue = [];
    var usedByRule = {};
    rules.forEach(function (id) { usedByRule[id] = {}; });

    var guard = 0;
    while (queue.length < count && guard < count * 40) {
      guard++;
      // weighted rule choice
      var total = rules.reduce(function (s, id) { return s + weights[id]; }, 0);
      var roll = Math.random() * total, chosen = rules[0];
      for (var i = 0; i < rules.length; i++) {
        roll -= weights[rules[i]];
        if (roll <= 0) { chosen = rules[i]; break; }
      }
      var pool = window.itemsForRule(chosen).filter(function (it) {
        return !usedByRule[chosen][it.id];
      });
      if (!pool.length) { weights[chosen] = 0.01; continue; }
      var item = pick(pool);
      usedByRule[chosen][item.id] = true;
      queue.push(item);
    }
    return Drills.shuffle(queue);
  }

  function buildRuleQueue(ruleId, count) {
    var pool = window.itemsForRule(ruleId);
    var shuffled = Drills.shuffle(pool);
    return count ? shuffled.slice(0, count) : shuffled;
  }

  // Runner: drive a queue of items to completion.
  function run(queue, container, opts) {
    opts = opts || {};
    var idx = 0;
    var correct = 0;
    var perRule = {};

    function summaryObj() {
      return { total: queue.length, correct: correct, perRule: perRule,
               kind: opts.kind || "session" };
    }

    function step() {
      if (idx >= queue.length) {
        Store.recordSession(summaryObj());
        if (opts.onFinish) opts.onFinish(summaryObj());
        return;
      }
      var item = queue[idx];
      renderProgress();
      Drills.render(item, container, function (isCorrect) {
        if (isCorrect) correct++;
        if (!perRule[item.rule]) perRule[item.rule] = { a: 0, c: 0 };
        perRule[item.rule].a++;
        if (isCorrect) perRule[item.rule].c++;
        idx++;
        step();
      });
    }

    function renderProgress() {
      if (!opts.progressEl) return;
      var pct = Math.round((idx / queue.length) * 100);
      opts.progressEl.innerHTML =
        '<div class="prog-txt">' + (idx + 1) + ' / ' + queue.length + '</div>' +
        '<div class="prog-bar"><span style="width:' + pct + '%"></span></div>';
    }

    if (!queue.length) {
      container.innerHTML = '<div class="empty">لا توجد عناصر لهذه القاعدة بعد.</div>';
      return;
    }
    step();
  }

  window.Session = { buildSession: buildSession, buildRuleQueue: buildRuleQueue, run: run };
})();
