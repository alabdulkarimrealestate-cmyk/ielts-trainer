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
    } else if (item.rule === "find_error") {
      wrap.appendChild(el("div", "q-hint", "فيها خطأ واحد فقط — اضغط على الكلمة الخاطئة:"));
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

    if (item.rule === "find_error") {
      // proofreading: the sentence is the answer area — tap the one wrong word
      box.className = "ans-box fe-box";
      var ftoks = [];
      item.words.forEach(function (w, idx) {
        var c = el("button", "tok ltr", w);
        c.type = "button";
        c.onclick = function () {
          selected = idx;
          ftoks.forEach(function (x, i) { mark(x, i === idx); });
          onChange();
        };
        ftoks.push(c); box.appendChild(c);
      });
      return {
        node: box,
        answered: function () { return selected !== null; },
        grade: function () { return selected === item.error_index; },
        answerText: function () { return item.words[selected]; },
        lock: function () { ftoks.forEach(function (c) { c.disabled = true; }); },
        revealCorrect: function () { ftoks[item.error_index].classList.add("correct"); }
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
  // opts.mode: "calm" (default) | "load" — stored with the attempt.
  function render(item, container, onNext, opts) {
    opts = opts || {};
    container.innerHTML = "";
    var card = el("div", "drill-card");
    card.appendChild(questionNode(item));

    var ctrl = answerControls(item, refresh);
    card.appendChild(ctrl.node);

    // reasoning
    var rLabel = el("label", "reason-label", "لماذا هذه الإجابة؟ (إلزامي قبل الكشف)");
    var reason = el("textarea", "reason");
    reason.rows = 2; reason.dir = "auto";
    reason.placeholder = "سطر واحد: لماذا هذه الإجابة؟ (عربي أو English)";
    window.Drills.lastRevealed = null;
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

    // Whatever fails after the reveal (saving on an odd device state, an
    // optional widget), the learner must ALWAYS get the feedback and the
    // "Next" button — a stuck card was reported on a phone (2026-11-07).
    revealBtn.onclick = function () {
      if (revealBtn.disabled) return;
      revealBtn.disabled = true;               // no double-tap double-record
      var correct = false, fault = null;
      function keep(e) { if (!fault) fault = e; try { console.error(e); } catch (x) {} }
      try { correct = !!ctrl.grade(); } catch (e) { keep(e); }
      try { ctrl.lock(); ctrl.revealCorrect(); } catch (e) { keep(e); }
      reason.disabled = true;
      revealBtn.classList.add("hidden");

      try { Store.record(item, correct, ctrl.answerText(), reason.value.trim(), opts.mode || "calm"); }
      catch (e) { keep(e); }
      // the floating coach (assistant.js) reads this to talk about the item on screen
      window.Drills.lastRevealed = { item: item, answer: ctrl.answerText(), reasoning: reason.value.trim(), correct: correct,
                                     visible: function () { return card.isConnected; } };

      feedback.classList.remove("hidden");
      feedback.classList.add(correct ? "ok" : "bad");
      try {
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

      // Stress cards bridge knowledge → execution: say it now and Gemini
      // listens (pron.js; Claude cannot hear audio). Without a key, pron.js
      // offers the Gemini key inline; without a microphone, a text reminder.
      if (window.READ_ALOUD_RULES && window.READ_ALOUD_RULES[item.rule]) {
        if (window.Pron && window.Recorder && window.Recorder.supported()) {
          var sayTarget = item.rule === "word_stress" ? item.word : (item.words || []).join(" ");
          var sayBtn = el("button", "btn wide pron-btn", "🎙 انطقها الآن — يسمعك ويقيّم النبر");
          sayBtn.type = "button";
          var sayHost = el("div", "pron-host");
          sayBtn.onclick = function () {
            sayBtn.classList.add("hidden");
            window.Pron.quickAssess(sayHost, {
              target: sayTarget, ipa: item.ipa || "",
              stress: item.rule === "word_stress" ? item.syllables.map(function (s, i) { return i === item.correct_index ? s.toUpperCase() : s.toLowerCase(); }).join("-") : "",
              unitId: item.rule === "word_stress" ? "word_stress" : "intonation"
            });
          };
          feedback.appendChild(sayBtn); feedback.appendChild(sayHost);
        } else {
          feedback.appendChild(el("div", "read-aloud",
            "🗣 اقرأها بصوت عالٍ الآن ×٣ — بالنبر الصحيح قبل أن تنتقل"));
        }
      }

      // Wrong answer -> live Socratic chat right here (Claude or Gemini, text
      // or voice), built from the user's OWN typed reasoning (the real
      // misconception). No key yet -> the key form opens in place and the
      // chat starts as soon as the key works (never a dead "enable AI" end).
      if (!correct) {
        var answerTxt = ctrl.answerText(), reasonTxt = reason.value.trim();
        var chatHost = el("div", "chat-host");
        var hasAI = function () { return !!(window.AI && window.AI.enabled()); };
        var chatLbl = function () { return hasAI() ? "💬 ناقش خطأك مع " + window.AI.providerLabel() + " الآن — كتابة أو صوت" : "💬 ناقش خطأك هنا — كتابة أو صوت"; };
        var openBtn = el("button", "btn wide chat-btn", chatLbl());
        openBtn.type = "button";
        var openChat = function () {
          while (chatHost.firstChild) chatHost.removeChild(chatHost.firstChild);
          openBtn.classList.add("hidden");
          window.Chat.openForError(chatHost, item, answerTxt, reasonTxt, function () {
            openBtn.textContent = chatLbl(); openBtn.classList.remove("hidden");
          });
        };
        openBtn.onclick = function () {
          if (hasAI() && window.Chat) { openChat(); return; }
          if (!window.PrepViews || !window.PrepViews.aiSetup) { if (window.App) window.App.go("plan"); return; }
          openBtn.classList.add("hidden");
          while (chatHost.firstChild) chatHost.removeChild(chatHost.firstChild);
          chatHost.appendChild(window.PrepViews.aiSetup(openChat));
        };
        feedback.appendChild(openBtn);
        if (!hasAI()) {
          var copyBtn = el("button", "btn small", "أو انسخ الحوار والصقه في Claude.ai");
          copyBtn.type = "button";
          copyBtn.onclick = function () { window.Prompts.copy(window.Prompts.errorChat(item, answerTxt, reasonTxt), copyBtn); };
          feedback.appendChild(copyBtn);
        }
        feedback.appendChild(chatHost);
      }

      } catch (e) { keep(e); }
      if (fault) {
        feedback.appendChild(el("div", "save-warn",
          "⚠ حصل خطأ في هذا السؤال (" + String((fault && fault.message) || fault).slice(0, 140) +
          ") — كمّل عادي، ولو تكرّر صوّر الشاشة وابعتها."));
      }
      var next = el("button", "btn wide", "التالي ⟵");
      next.type = "button";
      next.onclick = function () { onNext(correct); };
      feedback.appendChild(next);
      try { next.focus(); } catch (e) {}
    };
  }

  function correctText(item) {
    if (item.rule === "find_error") return item.words[item.error_index] + "  →  " + item.correction;
    if (item.rule === "word_stress") return item.syllables[item.correct_index].toUpperCase();
    if (item.rule === "sentence_stress") return item.stressed.map(function (i) { return item.words[i]; }).join(" · ");
    if (item.rule === "schwa") return item.schwa.map(function (i) { return item.syllables[i]; }).join(" · ");
    return item.correct_answer;
  }

  window.Drills = { render: render, shuffle: shuffle, lastRevealed: null };
})();
