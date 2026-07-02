/* dashboard.js — per-rule stats (never bundled) + SVG progress visuals. */
(function () {
  "use strict";

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // Sparkline of the last N attempts (1=correct green, 0=wrong red).
  function sparkline(recent) {
    if (!recent.length) return '<div class="spark-empty">لا بيانات بعد</div>';
    var w = 140, h = 34, n = recent.length, gap = 2;
    var bw = (w - gap * (n - 1)) / n;
    var bars = recent.map(function (v, i) {
      var x = i * (bw + gap);
      var bh = v ? h - 6 : 10;
      var y = h - bh;
      var col = v ? "var(--good)" : "var(--bad)";
      return '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + bw.toFixed(1) +
             '" height="' + bh + '" rx="1.5" fill="' + col + '"/>';
    }).join("");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="spark">' + bars + '</svg>';
  }

  // Ring gauge for accuracy %.
  function ring(pct) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - (pct || 0) / 100);
    var col = pct == null ? "var(--line)" : pct >= 75 ? "var(--good)" : pct >= 50 ? "var(--accent)" : "var(--bad)";
    return '<svg viewBox="0 0 64 64" class="ring">' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="7"/>' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" ' +
      'stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) +
      '" transform="rotate(-90 32 32)"/>' +
      '<text x="32" y="37" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">' +
      (pct == null ? "—" : pct + "%") + '</text></svg>';
  }

  var MODE_AR = { active: "نشطة", maintenance: "صيانة", background: "خلفية" };

  function card(rule) {
    var st = Store.ruleStat(rule.id);
    var acc = Store.accuracy(rule.id);
    var mode = window.ruleMode(rule.id);
    // calm vs load: consolidation is only real if it survives load
    var calm = Store.modeAccuracy(rule.id, "calm", 30);
    var load = Store.modeAccuracy(rule.id, "load", 30);
    function pct(x) { return x === null ? "—" : Math.round(x.accuracy * 100) + "%"; }
    var gap = (calm && load && calm.accuracy - load.accuracy >= 0.15);

    var c = el("div", "stat-card");
    c.innerHTML =
      '<div class="sc-top">' +
        '<div class="sc-ring">' + ring(acc) + '</div>' +
        '<div class="sc-meta">' +
          '<div class="sc-name">' + rule.label +
            ' <span class="mode-chip mode-' + mode + '">' + (MODE_AR[mode] || mode) + '</span></div>' +
          '<div class="sc-group">' + rule.group + '</div>' +
          '<div class="sc-nums">' +
            '<span>محاولات: <b>' + st.attempts + '</b></span>' +
            '<span>ستريك: <b>' + st.streak + '</b>🔥</span>' +
          '</div>' +
          '<div class="sc-modes">هادئ: <b>' + pct(calm) + '</b> · تحت الضغط: <b class="' +
            (gap ? "load-gap" : "") + '">' + pct(load) + '</b>' +
            (gap ? ' <span class="load-gap">↓ ينهار تحت الضغط</span>' : '') + '</div>' +
          '<div class="sc-last">آخر تدريب: ' + (st.lastPracticed || "—") + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sc-spark">' + sparkline(st.recent) + '</div>';
    var btn = el("button", "btn small", "تدرّب على هذه القاعدة");
    btn.onclick = function () { window.App.startRule(rule.id); };
    c.appendChild(btn);
    return c;
  }

  function render(container) {
    container.innerHTML = "";
    var head = el("div", "dash-head");
    head.innerHTML =
      '<div class="streak-big">🔥 ' + Store.globalStreak() + '</div>' +
      '<div class="streak-lbl">أيام متتالية من التدريب</div>';
    container.appendChild(head);

    var groups = {};
    window.RULES.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    Object.keys(groups).forEach(function (g) {
      container.appendChild(el("h3", "grp-title", g));
      var grid = el("div", "stat-grid");
      groups[g].forEach(function (r) { grid.appendChild(card(r)); });
      container.appendChild(grid);
    });
  }

  window.Dashboard = { render: render, ring: ring, sparkline: sparkline };
})();
