/* session.js — drives drill queues (calm & load) through Drills to a summary.
   Composition logic lives in engine.js; this file only runs the queue. */
(function () {
  "use strict";

  // Calm daily session — Leitner + active/maintenance/background weighting.
  function buildSession(count) {
    return window.Engine.buildCalmSession(count || 15);
  }

  // Load session — timed, mixes active + closed rules (consolidation test).
  function buildLoadQueue(count) {
    return window.Engine.buildLoadSession(count || (Store.settings().loadItems || 10));
  }

  function buildRuleQueue(ruleId, count) {
    var q = window.Engine.pickForRule(ruleId, count || 9999);
    return count ? q.slice(0, count) : q;
  }

  /* Runner. opts:
       mode: "calm" | "load"          (default calm; recorded per attempt)
       countdownSeconds: number       (load mode: visible countdown, auto-end)
       progressEl, onFinish, kind                                            */
  function run(queue, container, opts) {
    opts = opts || {};
    var mode = opts.mode || "calm";
    var idx = 0, correct = 0;
    var perRule = {};                 // ruleId -> { n, c }
    var timeLeft = opts.countdownSeconds || 0;
    var timer = null, timedOut = false;

    function summaryObj() {
      return {
        total: queue.length, answered: idx, correct: correct,
        perRule: perRule, mode: mode, timedOut: timedOut,
        kind: opts.kind || (mode === "load" ? "load_session" : "session")
      };
    }

    function finish() {
      if (timer) { clearInterval(timer); timer = null; }
      Store.recordSession(summaryObj());
      if (opts.onFinish) opts.onFinish(summaryObj());
    }

    function step() {
      if (idx >= queue.length || timedOut) { finish(); return; }
      renderProgress();
      Drills.render(queue[idx], container, function (isCorrect) {
        var item = queue[idx];
        if (isCorrect) correct++;
        if (!perRule[item.rule]) perRule[item.rule] = { n: 0, c: 0 };
        perRule[item.rule].n++;
        if (isCorrect) perRule[item.rule].c++;
        idx++;
        step();
      }, { mode: mode });
    }

    function renderProgress() {
      if (!opts.progressEl) return;
      var pct = Math.round((idx / queue.length) * 100);
      var html =
        '<div class="prog-txt">' + (idx + 1) + " / " + queue.length + "</div>" +
        '<div class="prog-bar"><span style="width:' + pct + '%"></span></div>';
      if (timeLeft > 0) {
        var mm = Math.floor(timeLeft / 60), ss = String(timeLeft % 60);
        if (ss.length < 2) ss = "0" + ss;
        html += '<div class="countdown' + (timeLeft <= 30 ? " danger" : "") + '">⏱ ' + mm + ":" + ss + "</div>";
      }
      opts.progressEl.innerHTML = html;
    }

    if (!queue.length) {
      container.innerHTML = '<div class="empty">لا توجد عناصر متاحة بعد.</div>';
      return;
    }

    if (opts.countdownSeconds) {
      timer = setInterval(function () {
        timeLeft--;
        renderProgress();
        if (timeLeft <= 0) {
          timedOut = true;
          clearInterval(timer); timer = null;
          // let the current card finish; if none answered yet, end now
          container.innerHTML = "";
          finish();
        }
      }, 1000);
    }

    step();
  }

  window.Session = {
    buildSession: buildSession,
    buildLoadQueue: buildLoadQueue,
    buildRuleQueue: buildRuleQueue,
    run: run
  };
})();
