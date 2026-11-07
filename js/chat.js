/* chat.js — in-page chat with Claude or Gemini (ai.js routes): text + voice. Used by (a) the Socratic
   error chat under a wrong answer and (b) the floating coach (assistant.js).
   Voice is the browser's own Web Speech API — dictation (SpeechRecognition:
   Chrome / Edge / Android, needs HTTPS) and read-aloud (speechSynthesis, the
   Arabic and English parts of a reply spoken by matching voices). Nothing is
   recorded or scored — pronunciation stays with the tutor / ELSA.
   Every chat is saved (Store.chats) so the reasoning trail can be reviewed. */
(function () {
  "use strict";

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var TTS = window.speechSynthesis || null;
  var active = null;   // the open widget (one at a time)

  function voiceSettings() {
    var s = Store.settings();
    if (!s.voice) s.voice = { autoSpeak: true, sttLang: "ar-EG", handsFree: false };
    if (!s.voice.replyLang) s.voice.replyLang = "en";   // English by default: one voice reads it smoothly; Arabic is opt-in
    return s.voice;
  }
  function saveVoice(v) { Store.setSetting("voice", v); }
  // Appended to every system prompt: the prompts are written for Arabic, so the
  // English mode overrides their language while keeping their structure.
  function langDirective(lang) {
    if (lang !== "en") return "";
    return [
"REPLY LANGUAGE OVERRIDE: reply in English only. Clear, simple English a B1-B2 learner follows easily: short complete sentences, everyday words, grammar terms named in English.",
"Do not write Arabic unless the learner explicitly asks for a translation; then give it briefly. Keep the structure the instructions above describe, with English labels instead of the Arabic ones (for example: Why you were wrong / The rule / How to avoid it / Try now).",
"If the learner writes in Arabic, still answer in English."
    ].join("\n");
  }
  function withLang(sys, lang) { var d = langDirective(lang); return d ? String(sys || "") + "\n\n" + d : sys; }

  /* ---------------- read-aloud (script-aware) ---------------- */
  var AR = /[؀-ۿ]/, LAT = /[A-Za-z]/;
  function splitByScript(text) {
    var out = [], cur = null;
    String(text).split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      var kind = AR.test(tok) ? "ar" : LAT.test(tok) ? "en" : null;   // neutral tokens join the current chunk
      if (kind === null) { if (cur) cur.text += tok; else cur = { kind: "ar", text: tok }; return; }
      if (cur && cur.kind === kind) cur.text += tok;
      else { if (cur) out.push(cur); cur = { kind: kind, text: tok }; }
    });
    if (cur) out.push(cur);
    return out.filter(function (c) { return c.text.trim(); });
  }
  function pickVoice(kind) {
    if (!TTS) return null;
    var voices = TTS.getVoices() || [];
    var prefs = kind === "ar" ? ["ar-eg", "ar-sa", "ar"] : ["en-gb", "en-us", "en"];
    for (var i = 0; i < prefs.length; i++) {
      var v = voices.filter(function (x) { return String(x.lang || "").replace("_", "-").toLowerCase().indexOf(prefs[i]) === 0; });
      if (v.length) { var local = v.filter(function (x) { return x.localService; }); return local[0] || v[0]; }
    }
    return null;
  }
  function cleanForSpeech(text) {
    return String(text || "").replace(/[*_#`>|]/g, " ").replace(/\s+/g, " ").trim();
  }
  // Sentence-sized pieces: Chrome silently stops long utterances (~15 s with
  // online voices) and drops queued ones it has no reference to, so a long
  // bilingual reply used to end after a sentence or two.
  function splitSentences(text) {
    var out = [];
    String(text).split(/\n+/).forEach(function (para) {
      (para.match(/[^.!?؟…]+[.!?؟…]*/g) || []).forEach(function (s) { s = s.trim(); if (s) out.push(s); });   // no lookbehind: older Safari
    });
    return out;
  }
  var run = 0, live = [], keepAlive = null;   // live: utterances kept referenced (Chrome GC bug)
  var DESKTOP_CHROME = /Chrome\//.test(navigator.userAgent) && !/Mobile|Android/.test(navigator.userAgent);
  // opts.rate: speaking rate (pronunciation models use a slower one)
  function speak(text, onDone, opts) {
    opts = opts || {};
    if (!TTS) { if (onDone) onDone(); return; }
    stopSpeaking();
    var chunks = [];
    splitSentences(cleanForSpeech(text)).forEach(function (s) {
      splitByScript(s).forEach(function (c) {
        var last = chunks[chunks.length - 1];
        // a lone English word inside an Arabic sentence (a, the, of) sounds choppy as its own utterance:
        // the Arabic voice reads it acceptably, so glue it on. Arabic never goes to the English voice.
        var glue = last && (last.text + " " + c.text).length <= 180 && (last.kind === c.kind || (c.kind === "en" && c.text.length <= 12 && last.kind === "ar"));
        if (glue) last.text += " " + c.text;
        else chunks.push({ kind: c.kind, text: c.text });
      });
    });
    if (!chunks.length) { if (onDone) onDone(); return; }
    var id = ++run, i = 0, done = false;
    function finish() { if (done) return; done = true; live = []; stopKeepAlive(); if (onDone) onDone(); }
    function next() {
      if (id !== run) return;                       // superseded by a newer speak()/stop
      if (i >= chunks.length) { finish(); return; }
      var c = chunks[i++];
      var u = new SpeechSynthesisUtterance(c.text);
      u.lang = c.kind === "ar" ? "ar-EG" : "en-GB"; u.rate = opts.rate || 0.95;
      var v = pickVoice(c.kind); if (v) u.voice = v;
      u.onend = function () { setTimeout(next, 60); };
      u.onerror = function (e) { if (e && e.error === "interrupted" || e && e.error === "canceled") return; setTimeout(next, 60); };  // skip a bad chunk, keep going
      live.push(u);
      TTS.speak(u);
    }
    if (DESKTOP_CHROME) keepAlive = setInterval(function () { if (TTS.speaking && !TTS.paused) { TTS.pause(); TTS.resume(); } }, 10000);
    next();
  }
  function stopKeepAlive() { if (keepAlive) { clearInterval(keepAlive); keepAlive = null; } }
  function stopSpeaking() { run++; live = []; stopKeepAlive(); if (TTS) { try { TTS.cancel(); } catch (e) {} } }

  /* ---------------- widget ----------------
     opts: { title, system (string | function), opening (hidden first turn),
             greeting (shown, not sent), quickPrompts (array | function),
             item, ruleTag, fallbackPrompt, persistent, onClose }            */
  function open(host, opts) {
    opts = opts || {};
    if (active && !active.persistent) active.close();
    var vs = voiceSettings();
    var history = [], record = null, busy = false, rec = null, listening = false, closed = false;

    host.innerHTML = "";
    var panel = el("div", "chat-panel");
    var head = el("div", "chat-head");
    head.appendChild(el("span", "chat-title", opts.title || ("💬 ناقش الخطأ مع " + ((window.AI && window.AI.enabled()) ? window.AI.providerLabel() : "AI"))));
    var tools = el("div", "chat-tools");
    var reply = el("button", "chat-tool", ""), spk = el("button", "chat-tool", ""), langB = el("button", "chat-tool", ""), hf = el("button", "chat-tool", "");
    [reply, spk, langB, hf].forEach(function (b) { b.type = "button"; tools.appendChild(b); });
    function paintTools() {
      reply.textContent = vs.replyLang === "en" ? "🗣 English" : "🗣 عربي"; reply.classList.toggle("on", vs.replyLang === "en");
      reply.title = "لغة ردود المدرّب — English أوضح في القراءة الصوتية؛ العربي اختياري";
      spk.textContent = vs.autoSpeak ? "🔊 قراءة" : "🔇 صامت"; spk.classList.toggle("on", !!vs.autoSpeak);
      spk.title = "قراءة الردود بصوت عالٍ";
      langB.textContent = vs.sttLang.indexOf("ar") === 0 ? "🎙 عربي" : "🎙 English"; langB.title = "لغة الإملاء الصوتي";
      hf.textContent = vs.handsFree ? "🎧 متواصل" : "🎧 يدوي"; hf.classList.toggle("on", !!vs.handsFree);
      hf.title = "محادثة صوتية متواصلة: يرسل بعد كلامك ويستمع بعد الرد";
    }
    reply.onclick = function () { vs.replyLang = vs.replyLang === "en" ? "ar" : "en"; saveVoice(vs); paintTools(); status.textContent = vs.replyLang === "en" ? "الردود القادمة بالإنجليزية" : "الردود القادمة بالعربية"; };
    spk.onclick = function () { vs.autoSpeak = !vs.autoSpeak; if (!vs.autoSpeak) stopSpeaking(); saveVoice(vs); paintTools(); };
    langB.onclick = function () { vs.sttLang = vs.sttLang.indexOf("ar") === 0 ? "en-GB" : "ar-EG"; saveVoice(vs); paintTools(); };
    hf.onclick = function () { vs.handsFree = !vs.handsFree; if (vs.handsFree) vs.autoSpeak = true; saveVoice(vs); paintTools(); if (vs.handsFree && !busy && !listening) startListening(); };
    paintTools();
    head.appendChild(tools); panel.appendChild(head);

    var msgs = el("div", "chat-msgs"); panel.appendChild(msgs);
    var status = el("div", "chat-status"); panel.appendChild(status);
    var quick = el("div", "quick-chips"); panel.appendChild(quick);

    var row = el("div", "chat-input-row");
    var mic = el("button", "btn mic-btn", "🎙"); mic.type = "button";
    var input = el("textarea", "chat-input"); input.rows = 2; input.dir = "auto";
    input.placeholder = SR ? "اكتب… أو اضغط 🎙 وتكلّم" : "اكتب…";
    var send = el("button", "btn primary send-btn", "أرسل"); send.type = "button";
    row.appendChild(mic); row.appendChild(input); row.appendChild(send); panel.appendChild(row);
    if (!SR) { mic.disabled = true; mic.title = "الإملاء الصوتي غير مدعوم في هذا المتصفّح"; panel.appendChild(el("div", "chat-hint", "الإملاء الصوتي يعمل في Chrome / Edge (وأندرويد) عبر HTTPS. القراءة بصوت عالٍ تعمل في معظم المتصفّحات.")); }

    var fallback = el("div", "chat-fallback hidden");
    if (opts.fallbackPrompt) {
      var cp = el("button", "btn small", "انسخ الحوار لـ Claude بدلًا من ذلك"); cp.type = "button";
      cp.onclick = function () { window.Prompts.copy(opts.fallbackPrompt, cp); };
      fallback.appendChild(cp);
    }
    panel.appendChild(fallback);

    var foot = el("div", "chat-foot");
    var stopB = el("button", "btn small", "⏹ أوقف الصوت"); stopB.type = "button"; stopB.onclick = function () { stopSpeaking(); stopListening(); };
    var newB = el("button", "btn small ghost", "محادثة جديدة"); newB.type = "button";
    newB.onclick = function () { stopAudio(); history = []; record = null; msgs.innerHTML = ""; if (opts.greeting) addMsg("model", opts.greeting); refreshQuick(); };
    var endB = el("button", "btn small ghost", opts.persistent ? "إغلاق" : "إنهاء الحوار"); endB.type = "button";
    endB.onclick = function () { if (opts.persistent) { if (opts.onClose) opts.onClose(); } else { close(); host.innerHTML = ""; if (opts.onClose) opts.onClose(); } };
    foot.appendChild(stopB); if (opts.persistent) foot.appendChild(newB); foot.appendChild(endB); panel.appendChild(foot);
    host.appendChild(panel);

    function addMsg(role, text) {
      var m = el("div", "msg " + role); m.dir = "auto"; m.textContent = text;
      msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m;
    }
    function setBusy(b) { busy = b; send.disabled = b; mic.disabled = b || !SR; status.textContent = b ? "… يفكّر" : ""; }
    function refreshQuick() {
      quick.innerHTML = "";
      var list = typeof opts.quickPrompts === "function" ? opts.quickPrompts() : (opts.quickPrompts || []);
      (list || []).forEach(function (q) {
        var c = el("button", "quick-chip", q); c.type = "button";
        c.onclick = function () { if (busy) return; ask(q); };
        quick.appendChild(c);
      });
      quick.classList.toggle("hidden", !(list && list.length));
    }
    function persist() {
      var messages = (opts.opening ? history.slice(1) : history.slice()).slice(-40);
      var rule = opts.ruleTag || (opts.item && opts.item.rule) || "chat";
      if (!record) record = Store.addChat({ itemId: opts.item && opts.item.id, rule: rule, title: opts.title || "", messages: messages });
      else Store.updateChat(record.id, { messages: messages });
    }
    function ask(userText, hidden) {
      if (busy || closed) return;
      stopSpeaking(); stopListening();
      if (!hidden) addMsg("user", userText);
      history.push({ role: "user", text: userText });
      var typing = addMsg("model typing", "…");
      setBusy(true);
      var sys = withLang(typeof opts.system === "function" ? opts.system() : opts.system, vs.replyLang);
      AI.chat(history, sys).then(function (reply) {
        if (closed) return;
        typing.classList.remove("typing"); typing.textContent = reply;
        history.push({ role: "model", text: reply });
        persist(); setBusy(false);
        if (vs.autoSpeak) speak(reply, function () { if (vs.handsFree && !busy && !closed) startListening(); });
        else if (vs.handsFree) startListening();
      }).catch(function (e) {
        typing.remove(); history.pop(); setBusy(false);
        status.textContent = "⚠ " + ((e && (e.ar || e.message)) || "خطأ");
        if (opts.fallbackPrompt) fallback.classList.remove("hidden");
      });
    }
    function sendInput() { var t = input.value.trim(); if (!t) return; input.value = ""; ask(t); }
    send.onclick = sendInput;
    input.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendInput(); } };

    /* ---- dictation ---- */
    function startListening() {
      if (!SR || listening || busy || closed) return;
      stopSpeaking();
      rec = new SR(); rec.lang = vs.sttLang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      var base = input.value ? input.value.trim() + " " : "";
      rec.onresult = function (e) {
        var interim = "", fin = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fin += t; else interim += t;
        }
        input.value = base + (fin || interim);
        if (fin) base = base + fin + " ";
      };
      rec.onerror = function (e) {
        var code = e && e.error;
        status.textContent = code === "not-allowed" ? "اسمح للمتصفّح باستخدام الميكروفون ثم حاول مرة أخرى" :
                             code === "no-speech" ? "لم أسمع شيئًا — اضغط 🎙 وتكلّم" : "تعذّر الإملاء الصوتي (" + code + ")";
        if (code !== "no-speech") { vs.handsFree = false; saveVoice(vs); paintTools(); }
      };
      rec.onend = function () {
        listening = false; mic.classList.remove("listening"); mic.textContent = "🎙";
        if (status.textContent.indexOf("أستمع") === 0) status.textContent = "";
        if (vs.handsFree && input.value.trim() && !busy && !closed) sendInput();
      };
      try {
        rec.start(); listening = true; mic.classList.add("listening"); mic.textContent = "⏺";
        status.textContent = "أستمع… (" + (vs.sttLang.indexOf("ar") === 0 ? "عربي" : "English") + ") — اضغط ⏺ للإيقاف";
      } catch (err) { listening = false; status.textContent = "تعذّر تشغيل الميكروفون"; }
    }
    function stopListening() { if (rec && listening) { try { rec.stop(); } catch (e) {} } }
    mic.onclick = function () { if (listening) stopListening(); else startListening(); };

    function stopAudio() { stopListening(); stopSpeaking(); }
    function close() { closed = true; stopAudio(); if (active === api) active = null; }
    var api = { close: close, ask: ask, stopAudio: stopAudio, refreshQuick: refreshQuick, persistent: !!opts.persistent, focus: function () { input.focus(); } };
    active = api;

    if (opts.greeting) addMsg("model", opts.greeting);
    refreshQuick();
    if (opts.opening) ask(opts.opening, true);
    return api;
  }

  // Convenience: open a Socratic chat about a wrong drill answer.
  function openForError(host, item, answer, reasoning, onClose) {
    var P = window.Prompts;
    return open(host, {
      title: "💬 " + (window.ruleLabel ? window.ruleLabel(item.rule) : item.rule) + " — اشرح لي خطأي",
      system: P.errorChatSystem(),
      opening: P.errorChatOpening(item, answer, reasoning),
      fallbackPrompt: P.errorChat(item, answer, reasoning),
      item: item, onClose: onClose
    });
  }

  // Called on every screen change: inline chats close (their DOM is gone);
  // the persistent coach drawer only goes quiet.
  function stopActive() { if (!active) return; if (active.persistent) active.stopAudio(); else active.close(); }

  window.Chat = { open: open, openForError: openForError, speak: speak, stop: stopSpeaking, stopActive: stopActive,
                  supported: { stt: !!SR, tts: !!TTS } };
})();
