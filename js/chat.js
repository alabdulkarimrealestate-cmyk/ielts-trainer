/* chat.js — in-page Socratic error chat with Gemini: text + voice.
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
    return s.voice;
  }
  function saveVoice(v) { Store.setSetting("voice", v); }

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
  function speak(text, onDone) {
    if (!TTS) { if (onDone) onDone(); return; }
    TTS.cancel();
    var chunks = splitByScript(cleanForSpeech(text));
    if (!chunks.length) { if (onDone) onDone(); return; }
    var done = false;
    function finish() { if (!done) { done = true; if (onDone) onDone(); } }
    chunks.forEach(function (c, i) {
      var u = new SpeechSynthesisUtterance(c.text);
      u.lang = c.kind === "ar" ? "ar-EG" : "en-GB"; u.rate = 0.95;
      var v = pickVoice(c.kind); if (v) u.voice = v;
      if (i === chunks.length - 1) { u.onend = finish; u.onerror = finish; }
      TTS.speak(u);
    });
  }
  function stopSpeaking() { if (TTS) { try { TTS.cancel(); } catch (e) {} } }

  /* ---------------- widget ---------------- */
  // opts: { title, system, opening, item, fallbackPrompt, onClose }
  function open(host, opts) {
    opts = opts || {};
    if (active) active.close();
    var vs = voiceSettings();
    var history = [], record = null, busy = false, rec = null, listening = false, closed = false;

    host.innerHTML = "";
    var panel = el("div", "chat-panel");
    var head = el("div", "chat-head");
    head.appendChild(el("span", "chat-title", opts.title || "💬 ناقش الخطأ مع Gemini"));
    var tools = el("div", "chat-tools");
    var spk = el("button", "chat-tool", ""), langB = el("button", "chat-tool", ""), hf = el("button", "chat-tool", "");
    [spk, langB, hf].forEach(function (b) { b.type = "button"; tools.appendChild(b); });
    function paintTools() {
      spk.textContent = vs.autoSpeak ? "🔊 قراءة" : "🔇 صامت"; spk.classList.toggle("on", !!vs.autoSpeak);
      spk.title = "قراءة الردود بصوت عالٍ";
      langB.textContent = vs.sttLang.indexOf("ar") === 0 ? "🎙 عربي" : "🎙 English"; langB.title = "لغة الإملاء الصوتي";
      hf.textContent = vs.handsFree ? "🎧 متواصل" : "🎧 يدوي"; hf.classList.toggle("on", !!vs.handsFree);
      hf.title = "محادثة صوتية متواصلة: يرسل بعد كلامك ويستمع بعد الرد";
    }
    spk.onclick = function () { vs.autoSpeak = !vs.autoSpeak; if (!vs.autoSpeak) stopSpeaking(); saveVoice(vs); paintTools(); };
    langB.onclick = function () { vs.sttLang = vs.sttLang.indexOf("ar") === 0 ? "en-GB" : "ar-EG"; saveVoice(vs); paintTools(); };
    hf.onclick = function () { vs.handsFree = !vs.handsFree; if (vs.handsFree) vs.autoSpeak = true; saveVoice(vs); paintTools(); if (vs.handsFree && !busy && !listening) startListening(); };
    paintTools();
    head.appendChild(tools); panel.appendChild(head);

    var msgs = el("div", "chat-msgs"); panel.appendChild(msgs);
    var status = el("div", "chat-status"); panel.appendChild(status);

    var row = el("div", "chat-input-row");
    var mic = el("button", "btn mic-btn", "🎙"); mic.type = "button";
    var input = el("textarea", "chat-input"); input.rows = 2; input.dir = "auto";
    input.placeholder = SR ? "اكتب ردّك… أو اضغط 🎙 وتكلّم" : "اكتب ردّك…";
    var send = el("button", "btn primary send-btn", "أرسل"); send.type = "button";
    row.appendChild(mic); row.appendChild(input); row.appendChild(send); panel.appendChild(row);
    if (!SR) { mic.disabled = true; mic.title = "الإملاء الصوتي غير مدعوم في هذا المتصفّح"; panel.appendChild(el("div", "chat-hint", "الإملاء الصوتي يعمل في Chrome / Edge (وأندرويد) عبر HTTPS. القراءة بصوت عالٍ تعمل في معظم المتصفّحات.")); }

    var fallback = el("div", "chat-fallback hidden");
    var cp = el("button", "btn small", "انسخ الحوار لـ Claude بدلًا من ذلك"); cp.type = "button";
    cp.onclick = function () { if (opts.fallbackPrompt) window.Prompts.copy(opts.fallbackPrompt, cp); };
    fallback.appendChild(cp); panel.appendChild(fallback);

    var foot = el("div", "chat-foot");
    var stopB = el("button", "btn small", "⏹ أوقف الصوت"); stopB.type = "button"; stopB.onclick = function () { stopSpeaking(); stopListening(); };
    var endB = el("button", "btn small ghost", "إنهاء الحوار"); endB.type = "button"; endB.onclick = function () { close(); host.innerHTML = ""; if (opts.onClose) opts.onClose(); };
    foot.appendChild(stopB); foot.appendChild(endB); panel.appendChild(foot);
    host.appendChild(panel);

    function addMsg(role, text) {
      var m = el("div", "msg " + role); m.dir = "auto"; m.textContent = text;
      msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m;
    }
    function setBusy(b) { busy = b; send.disabled = b; mic.disabled = b || !SR; status.textContent = b ? "… يفكّر" : ""; }
    function persist() {
      var messages = history.slice(1, 1 + 40);   // skip the hidden opening context
      if (!record) record = Store.addChat({ itemId: opts.item && opts.item.id, rule: opts.item && opts.item.rule, title: opts.title || "", messages: messages });
      else Store.updateChat(record.id, { messages: messages });
    }
    function ask(userText, hidden) {
      if (busy || closed) return;
      stopSpeaking(); stopListening();
      if (!hidden) addMsg("user", userText);
      history.push({ role: "user", text: userText });
      var typing = addMsg("model typing", "…");
      setBusy(true);
      AI.chat(history, opts.system).then(function (reply) {
        if (closed) return;
        typing.classList.remove("typing"); typing.textContent = reply;
        history.push({ role: "model", text: reply });
        persist(); setBusy(false);
        if (vs.autoSpeak) speak(reply, function () { if (vs.handsFree && !busy && !closed) startListening(); });
        else if (vs.handsFree) startListening();
      }).catch(function (e) {
        typing.remove(); setBusy(false);
        status.textContent = "⚠ " + ((e && (e.ar || e.message)) || "خطأ");
        fallback.classList.remove("hidden");
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

    function close() { closed = true; stopListening(); stopSpeaking(); if (active === api) active = null; }
    var api = { close: close, ask: ask };
    active = api;

    if (opts.opening) ask(opts.opening, true);
    return api;
  }

  // Convenience: open a Socratic chat about a wrong drill answer.
  function openForError(host, item, answer, reasoning, onClose) {
    var P = window.Prompts;
    return open(host, {
      title: "💬 " + (window.ruleLabel ? window.ruleLabel(item.rule) : item.rule) + " — ناقش خطأك",
      system: P.errorChatSystem(),
      opening: P.errorChatOpening(item, answer, reasoning),
      fallbackPrompt: P.errorChat(item, answer, reasoning),
      item: item, onClose: onClose
    });
  }

  function stopActive() { if (active) active.close(); }

  window.Chat = { open: open, openForError: openForError, speak: speak, stop: stopSpeaking, stopActive: stopActive,
                  supported: { stt: !!SR, tts: !!TTS } };
})();
