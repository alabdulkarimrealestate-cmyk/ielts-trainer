/* drills.js — renders one drill item with the "reason before reveal" mechanic.
   Flow: answer -> type justification -> reveal correct + explanation -> next.
   NO skip-reasoning shortcut (by design). */
(function () {
  "use strict";

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function setEq(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.slice().sort(function (x, y) { return x - y; });
    var sb = b.slice().sort(function (x, y) { return x - y; });
    return sa.every(function (v, i) { return v === sb[i]; });
  }
  function norm(s) { return String(s).trim().toLowerCase().replace(/\s+/g, " "); }

  // Build the question header for an item.
  function questionNode(item) {
    var wrap = el("div", "q-head");
    var tag = el("div", "rule-chip", window.ruleLabel(item.rule));
    wrap.appendChild(tag);

    if (item.rule === "word_stress" || item.rule === "schwa") {
      var w = el("div", "q-word ltr", item.word);
      wrap.appendChild(w);
      var hint = el("div", "q-hint",
        item.rule === "word_stress" ? "اختر المقطع الذي يحمل النبر الأساسي:"
                                    : "اختر المقطع/المقاطع الذي يحمل صوت الشوا /ə/:");
      wrap.appendChild(hint);
    } else if (item.rule === "sentence_stress") {
      var hint2 = el("div", "q-hint", "اختر الكلمات التي تُنبَر (كلمات المحتوى):");
      wrap.appendChild(hint2);
    } else if (item.rule === "ipa") {
      var dir = item.direction === "word_to_symbol"
        ? "ما الرمز الصوتي للحرف الملوّن في الكلمة؟" : "أي كلمة تحتوي على هذا الصوت؟";
      wrap.appendChild(el("div", "q-hint", dir));
      wrap.appendChild(el("div", "q-word ltr", item.prompt));
    } else {
      // fill-in-the-blank sentence
      var s = el("div", "q-sentence ltr");
      var parts = String(item.sentence_with_gap).split("___");
      s.appendChild(document.createTextNode(parts[0] || ""));
      var blank = el("span", "blank", "؟");
      s.appendChild(blank);
      s.appendChild(document.createTextNode(parts[1] || ""));
      wrap.appendChild(s);
    }
    return wrap;
  }

  // Render the answer controls; returns { getAnswer, isAnswered, grade, answerText }.
  function answerControls(item, onChange) {
    var box = el("div", "ans-box");
    var selected = null;         // single index/value
    var selectedSet = [];        // multi

    function mark(node, on) { node.classList.toggle("sel", on); }

    if (item.rule === "word_stress") {
      var chips = [];
      item.syllables.forEach(function (syl, idx) {
        var c = el("button", "tok ltr", syl);
        c.type = "button";
        c.onclick = function () {
          selected = idx;
          chips.forEach(function (x, i) { mark(x, i === idx); });
          onChange();
        };
        chips.push(c); box.appendChild(c);
      });
      return {
        node: box,
        answered: function () { return selected !== null; },
        grade: function () { return selected === item.correct_index; },
        answerText: function () { return item.syllables[selected]; },
        lock: function () { chips.forEach(function (c) { c.disabled = true; }); },
        revealCorrect: function () { mark(chips[item.correct_index], true); chips[item.correct_index].classList.add("correct"); }
      };
    }

    if (item.rule === "sentence_stress" || item.rule === "schwa") {
      var units = item.rule === "sentence_stress" ? item.words : item.syllables;
      var key = item.rule === "sentence_stress" ? item.stressed : item.schwa;
      var toks = [];
      units.forEach(function (u, idx) {
        var c = el("button", "tok ltr", u);
        c.type = "button";
        c.onclick = function () {
          var p = selectedSet.indexOf(idx);
          if (p === -1) selectedSet.push(idx); else selectedSet.splice(p, 1);
          mark(c, selectedSet.indexOf(idx) !== -1);
          onChange();
        };
        toks.push(c); box.appendChild(c);
      });
      return {
        node: box,
        answered: function () { return selectedSet.length > 0; },
        grade: function () { return setEq(selectedSet, key); },
        answerText: function () { return selectedSet.map(function (i) { return units[i]; }).join(" · "); },
        lock: function () { toks.forEach(function (c) { c.disabled = true; }); },
        revealCorrect: function () { key.forEach(function (i) { toks[i].classList.add("correct"); }); }
      };
    }

    // Multiple-choice (grammar, vocab, collocations, ipa)
    var options = shuffle([item.correct_answer].concat(item.distractors || []));
    var btns = [];
    options.forEach(function (opt) {
      var c = el("button", "opt ltr", opt);
      c.type = "button";
      c.onclick = function () {
        selected = opt;
        btns.forEach(function (b) { mark(b, b === c); });
        onChange();
      };
      btns.push(c); box.appendChild(c);
    });
    return {
      node: box,
      answered: function () { return selected !== null; },
      grade: function () { return norm(selected) === norm(item.correct_answer); },
      answerText: function () { return selected; },
      lock: function () { btns.forEach(function (b) { b.disabled = true; }); },
      revealCorrect: function () {
        btns.forEach(function (b) {
          if (norm(b.textContent) === norm(item.correct_answer)) b.classList.add("correct");
        });
      }
    };
  }

  // Public: render item into container. onNext(isCorrect) called after reveal+next.
  function render(item, container, onNext) {
    container.innerHTML = "";
    var card = el("div", "drill-card");
    card.appendChild(questionNode(item));

    var ctrl = answerControls(item, refresh);
    card.appendChild(ctrl.node);

    // reasoning
    var rLabel = el("label", "reason-label", "لماذا هذه الإجابة؟ (إلزامي قبل الكشف)");
    var reason = el("textarea", "reason ltr");
    reason.rows = 2;
    reason.placeholder = "Write one line: why this answer?";
    reason.oninput = refresh;
    card.appendChild(rLabel);
    card.appendChild(reason);

    var revealBtn = el("button", "btn primary wide", "أظهر الإجابة");
    revealBtn.type = "button";
    revealBtn.disabled = true;
    card.appendChild(revealBtn);

    var feedback = el("div", "feedback hidden");
    card.appendChild(feedback);

    container.appendChild(card);

    function refresh() {
      revealBtn.disabled = !(ctrl.answered() && reason.value.trim().length > 0);
    }

    revealBtn.onclick = function () {
      if (revealBtn.disabled) return;
      var correct = ctrl.grade();
      ctrl.lock();
      ctrl.revealCorrect();
      reason.disabled = true;
      revealBtn.classList.add("hidden");

      Store.record(item, correct, ctrl.answerText(), reason.value.trim());

      feedback.classList.remove("hidden");
      feedback.classList.add(correct ? "ok" : "bad");
      var badge = el("div", "verdict", correct ? "✓ إجابة صحيحة" : "✗ إجابة غير صحيحة");
      feedback.appendChild(badge);

      var ans = el("div", "correct-line");
      ans.appendChild(el("span", "lbl", "الإجابة الصحيحة: "));
      ans.appendChild(el("span", "val ltr", correctText(item)));
      feedback.appendChild(ans);

      if (item.ipa) {
        var ipaL = el("div", "ipa-line ltr", item.ipa);
        feedback.appendChild(ipaL);
      }
      feedback.appendChild(el("div", "explain", item.explanation || ""));

      // Wrong answer -> offer a live Socratic error-chat prompt for Claude,
      // built from the user's OWN typed reasoning (the real misconception).
      if (!correct) {
        var chatBtn = el("button", "btn wide chat-btn", "💬 افهم خطأك — ناقشه مع Claude (نسخ)");
        chatBtn.type = "button";
        chatBtn.onclick = function () {
          window.Prompts.copy(
            window.Prompts.errorChat(item, ctrl.answerText(), reason.value.trim()),
            chatBtn
          );
        };
        feedback.appendChild(chatBtn);
        feedback.appendChild(el("div", "chat-hint",
          "انسخ ← افتح Claude ← الصق. سيحاورك سؤالًا بسؤال حتى الفهم الكامل، ثم يختبرك بأمثلة جديدة."));
      }

      var next = el("button", "btn wide", "التالي ⟵");
      next.type = "button";
      next.onclick = function () { onNext(correct); };
      feedback.appendChild(next);
      next.focus();
    };
  }

  function correctText(item) {
    if (item.rule === "word_stress") return item.syllables[item.correct_index].toUpperCase();
    if (item.rule === "sentence_stress") return item.stressed.map(function (i) { return item.words[i]; }).join(" · ");
    if (item.rule === "schwa") return item.schwa.map(function (i) { return item.syllables[i]; }).join(" · ");
    return item.correct_answer;
  }

  window.Drills = { render: render, shuffle: shuffle };
})();
