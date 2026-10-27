/* ai.js — Gemini client (free tier) for essay / transcript evaluation and the
   weekly coaching report. The key is pasted once per device and kept in its
   own localStorage entry (never inside Store state, so it is never synced to
   the Gist, exported, or committed). Every call has a zero-cost fallback in
   the UI: copy the same prompt into Claude and paste the reply back. */
(function () {
  "use strict";
  var CFG_KEY = "ielts_ai_cfg";
  var BASE = "https://generativelanguage.googleapis.com/v1beta";
  var DEFAULT_MODEL = "gemini-2.5-flash";
  var STATIC_FALLBACKS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

  function loadCfg() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { return {}; }
  }
  var cfg = loadCfg();   // { key, model, enabled, models: [...], lastOk }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }

  function enabled() { return !!(cfg.enabled && cfg.key); }
  function model() { return cfg.model || DEFAULT_MODEL; }

  /* ---------------- errors (Arabic, never echo the key) ---------------- */

  function aiError(code, ar, extra) {
    var e = new Error(ar);
    e.code = code; e.ar = ar;
    if (extra) e.extra = extra;
    return e;
  }

  function mapHttpError(status, body, modelName) {
    var msg = "";
    try { msg = (body && body.error && body.error.message) || ""; } catch (e) {}
    var retry = null;
    try {
      (body.error.details || []).forEach(function (d) { if (d.retryDelay) retry = d.retryDelay; });
    } catch (e) {}
    if (status === 400 && /api key not valid|API_KEY_INVALID/i.test(msg)) return aiError("bad_key", "المفتاح غير صالح — تأكد من نسخه كاملًا من Google AI Studio.");
    if (status === 401 || status === 403) return aiError("bad_key", "المفتاح مرفوض (403) — تحقّق من صلاحيته ومن قيود الاستخدام في AI Studio.");
    if (status === 404) return aiError("no_model", "النموذج «" + modelName + "» غير متاح — اختر نموذجًا آخر من الإعدادات.", { model: modelName });
    if (status === 429) return aiError("quota", "تجاوزت حدّ الطبقة المجانية مؤقتًا" + (retry ? " — أعد المحاولة بعد " + retry : " — انتظر دقيقة ثم أعد المحاولة") + "، أو استخدم مسار النسخ إلى Claude.");
    if (status >= 500) return aiError("server", "خدمة Gemini غير متاحة حاليًا (" + status + ") — حاول لاحقًا أو استخدم مسار النسخ.");
    if (status === 400) return aiError("bad_request", "طلب مرفوض (400): " + (msg ? msg.slice(0, 160) : "تحقّق من الإعدادات."));
    return aiError("http", "خطأ من Gemini (" + status + ")" + (msg ? ": " + msg.slice(0, 120) : ""));
  }

  /* ---------------- transport ---------------- */

  // Header auth first (what the official JS SDK does); if the browser's CORS
  // preflight refuses the custom header (e.g. from file://), retry with ?key=.
  function request(path, opts, keyOverride) {
    var key = keyOverride || cfg.key;
    if (!key) return Promise.reject(aiError("no_key", "لم يُضبط مفتاح Gemini بعد — أضفه من «الخطة» ▸ الذكاء الاصطناعي."));
    if (typeof navigator !== "undefined" && navigator.onLine === false)
      return Promise.reject(aiError("offline", "لا يوجد اتصال بالإنترنت — استخدم مسار النسخ إلى Claude أو الإدخال اليدوي."));
    opts = opts || {};
    var body = opts.body ? JSON.stringify(opts.body) : undefined;
    function go(useQuery) {
      var url = BASE + path + (useQuery ? (path.indexOf("?") === -1 ? "?" : "&") + "key=" + encodeURIComponent(key) : "");
      var headers = { "Content-Type": "application/json" };
      if (!useQuery) headers["x-goog-api-key"] = key;
      return fetch(url, { method: opts.method || "GET", headers: headers, body: body });
    }
    return go(false).catch(function () { return go(true); })
      .then(function (r) {
        return r.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
          if (!r.ok) throw mapHttpError(r.status, data, opts.modelName || model());
          return data;
        });
      }, function (err) {
        if (err && err.code) throw err;
        throw aiError("network", "تعذّر الوصول إلى Gemini — تحقّق من الاتصال أو من حظر الشبكة.");
      });
  }

  // Models that can generateContent — the source of truth for the picker.
  function listModels(keyOverride) {
    return request("/models?pageSize=200", {}, keyOverride).then(function (data) {
      var names = ((data && data.models) || []).filter(function (m) {
        return (m.supportedGenerationMethods || []).indexOf("generateContent") !== -1 && /gemini/i.test(m.name || "");
      }).map(function (m) { return String(m.name).replace(/^models\//, ""); });
      names.sort(function (a, b) {
        var pa = /flash/.test(a) ? 0 : 1, pb = /flash/.test(b) ? 0 : 1;   // flash first (free-tier friendly)
        return pa !== pb ? pa - pb : (a < b ? 1 : -1);
      });
      return names;
    });
  }

  // Validate a key, remember the available models, and enable.
  function enable(key, chosenModel) {
    key = String(key || "").trim();
    if (!key) return Promise.reject(aiError("no_key", "الصق المفتاح أولًا."));
    return listModels(key).then(function (names) {
      var m = chosenModel || cfg.model || DEFAULT_MODEL;
      if (names.length && names.indexOf(m) === -1) m = names[0];
      cfg = { key: key, model: m, enabled: true, models: names, lastOk: new Date().toISOString() };
      saveCfg();
      return { model: m, models: names };
    });
  }
  function disable() { cfg = {}; saveCfg(); }
  function setModel(m) { if (m) { cfg.model = m; saveCfg(); } }

  /* ---------------- structured generation ---------------- */

  function extractText(data) {
    var c = data && data.candidates && data.candidates[0];
    if (!c) {
      var block = data && data.promptFeedback && data.promptFeedback.blockReason;
      throw aiError("blocked", block ? "رفض النموذج الطلب (" + block + ")." : "لم يُرجع النموذج أي محتوى.");
    }
    if (c.finishReason === "MAX_TOKENS") throw aiError("too_long", "الرد تجاوز الحد — أعد المحاولة أو قصّر النص.");
    if (c.finishReason === "SAFETY") throw aiError("blocked", "أوقف النموذج الرد لأسباب أمان — عدّل النص وأعد المحاولة.");
    var parts = (c.content && c.content.parts) || [];
    return parts.map(function (p) { return p.text || ""; }).join("");
  }

  function modelCandidates() {
    var candidates = [model()].concat((cfg.models || []).filter(function (m) { return m !== model(); }).slice(0, 2),
                                      STATIC_FALLBACKS.filter(function (m) { return m !== model(); }));
    var seen = {};
    return candidates.filter(function (m) { if (seen[m]) return false; seen[m] = 1; return true; });
  }

  // Multi-turn plain-text chat. history: [{ role: "user" | "model", text }].
  // Same model fallback as generateJSON; the last 24 turns are sent.
  function chat(history, system, opts) {
    opts = opts || {};
    var contents = (history || []).slice(-24).map(function (h) {
      return { role: h.role === "model" ? "model" : "user", parts: [{ text: String(h.text || "") }] };
    });
    if (!contents.length) return Promise.reject(aiError("bad_request", "لا رسالة لإرسالها."));
    var candidates = modelCandidates();
    function attempt(idx, withThinking) {
      if (idx >= candidates.length) return Promise.reject(aiError("no_model", "لا يوجد نموذج Gemini متاح لهذا المفتاح — افتح الإعدادات واختر نموذجًا."));
      var m = candidates[idx];
      var gen = { temperature: opts.temperature != null ? opts.temperature : 0.7, maxOutputTokens: opts.maxOutputTokens || 1024 };
      if (withThinking && /2\.5/.test(m)) gen.thinkingConfig = { thinkingBudget: 0 };
      var body = { contents: contents, generationConfig: gen };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      return request("/models/" + encodeURIComponent(m) + ":generateContent", { method: "POST", body: body, modelName: m })
        .then(function (data) { return extractText(data).trim(); })
        .catch(function (err) {
          if (err && err.code === "no_model") return attempt(idx + 1, withThinking);
          if (err && err.code === "bad_request" && withThinking && /thinking/i.test(err.message || "")) return attempt(idx, false);
          throw err;
        });
    }
    return attempt(0, true);
  }

  // One JSON-mode call. Tries the configured model, then the known fallbacks
  // on "model not found"; drops thinkingConfig if the model rejects it.
  function generateJSON(prompt, schema, opts) {
    opts = opts || {};
    var candidates = modelCandidates();

    function attempt(idx, withThinking) {
      if (idx >= candidates.length) return Promise.reject(aiError("no_model", "لا يوجد نموذج Gemini متاح لهذا المفتاح — افتح الإعدادات واختر نموذجًا."));
      var m = candidates[idx];
      var gen = { responseMimeType: "application/json", temperature: opts.temperature != null ? opts.temperature : 0.2, maxOutputTokens: opts.maxOutputTokens || 8192 };
      if (schema) gen.responseSchema = schema;
      if (withThinking && /2\.5/.test(m)) gen.thinkingConfig = { thinkingBudget: 0 };
      var body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: gen };
      if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
      return request("/models/" + encodeURIComponent(m) + ":generateContent", { method: "POST", body: body, modelName: m })
        .then(function (data) {
          var text = extractText(data);
          var obj = null;
          try { obj = JSON.parse(text); } catch (e) { obj = window.Prompts && window.Prompts.parseJSON ? window.Prompts.parseJSON(text) : null; }
          if (!obj) throw aiError("parse", "تعذّر قراءة ردّ النموذج كبيانات — جرّب مرة أخرى أو الصق الردّ يدويًا.", { raw: text });
          obj.__model = m;
          return obj;
        })
        .catch(function (err) {
          if (err && err.code === "no_model") return attempt(idx + 1, withThinking);
          if (err && err.code === "bad_request" && withThinking && /thinking/i.test(err.message || "")) return attempt(idx, false);
          throw err;
        });
    }
    return attempt(0, true);
  }

  /* ---------------- high-level tasks ---------------- */

  function evaluateWriting(args) {
    var Pr = window.Prompts;
    var prompt = Pr.writing(args.essay, args.prompt, { task: args.task, minutes: args.minutes, forAI: true });
    return generateJSON(prompt, Pr.schemas.writing).then(function (obj) {
      var ev = Pr.normalize.writing(obj, args.task);
      if (!ev) throw aiError("parse", "الردّ لا يحوي درجات صالحة — أعد المحاولة.", { raw: JSON.stringify(obj).slice(0, 500) });
      ev.model = obj.__model; ev.source = "gemini"; ev.ts = new Date().toISOString();
      return ev;
    });
  }

  function evaluateSpeakingTranscript(args) {
    var Pr = window.Prompts;
    var prompt = Pr.speakingTranscript(args.transcript, args.part, { forAI: true });
    return generateJSON(prompt, Pr.schemas.speaking).then(function (obj) {
      var ev = Pr.normalize.speaking(obj);
      if (!ev) throw aiError("parse", "الردّ لا يحوي درجات صالحة — أعد المحاولة.");
      ev.model = obj.__model; ev.source = "gemini"; ev.ts = new Date().toISOString();
      return ev;
    });
  }

  function weeklyReport(pack) {
    var Pr = window.Prompts;
    var prompt = Pr.weeklyReport(pack, { forAI: true });
    return generateJSON(prompt, Pr.schemas.report, { maxOutputTokens: 8192 }).then(function (obj) {
      var rep = Pr.normalize.report(obj);
      if (!rep) throw aiError("parse", "الردّ لا يطابق شكل التقرير — أعد المحاولة.");
      rep.model = obj.__model; rep.source = "gemini";
      return rep;
    });
  }

  window.AI = {
    enabled: enabled, model: model, models: function () { return cfg.models || []; },
    lastOk: function () { return cfg.lastOk || null; },
    enable: enable, disable: disable, setModel: setModel, listModels: listModels,
    generateJSON: generateJSON, chat: chat,
    evaluateWriting: evaluateWriting, evaluateSpeakingTranscript: evaluateSpeakingTranscript, weeklyReport: weeklyReport
  };
})();
