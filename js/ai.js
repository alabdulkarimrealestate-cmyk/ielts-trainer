/* ai.js — the app's AI layer, two providers:
     • Claude (Anthropic API, the user's own credit) — every TEXT task: chats,
       error discussions, the floating coach, essay/transcript evaluation,
       the weekly report. Preferred when its key is set.
     • Gemini (free tier) — the only one that can LISTEN, so every AUDIO task
       (pronunciation lab, speaking mock) uses it; also a text fallback.
   Keys are pasted once per device and kept in their own localStorage entries
   (never inside Store state, so never synced to the Gist, exported, or
   committed). Every call also has a manual "copy the prompt into Claude"
   fallback in the UI. Raw fetch, no SDK: the app opens from file:// with
   plain <script> tags and no build step, where an ES-module SDK cannot load. */
(function () {
  "use strict";
  var CFG_KEY = "ielts_ai_cfg";
  var BASE = "https://generativelanguage.googleapis.com/v1beta";
  var DEFAULT_MODEL = "gemini-2.5-flash";
  // Free-tier quotas are PER MODEL: when one is exhausted (429) the next is tried.
  var STATIC_FALLBACKS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.0-flash"];
  // Only plain text chat models: no TTS / image / transcription / robotics /
  // computer-use / preview codenames. Ranked lite-flash newest first (roomiest
  // free tier), then flash, then pro.
  var EXCLUDE = /tts|image|transcribe|robotics|computer-use|banana|argon|omni|customtools|embedding|aqa|learnlm|gemma/i;
  function rankKey(m) {
    if (!/^gemini-/.test(m) || EXCLUDE.test(m)) return null;
    var tier = /lite/.test(m) ? 0 : /flash/.test(m) ? 1 : /pro/.test(m) ? 2 : 3;
    var ver = parseFloat((m.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);
    if (/latest/.test(m)) ver = 99;                       // rolling alias = newest
    if (/preview|exp/.test(m)) ver -= 0.05;               // stable before preview of the same version
    return tier * 1000 + (100 - ver);
  }
  function rankModels(names) {
    return (names || []).filter(function (m) { return rankKey(m) !== null; })
      .sort(function (a, b) { return rankKey(a) - rankKey(b); });
  }

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
    var retrySec = null;
    try {
      (body.error.details || []).forEach(function (d) {
        if (d.retryDelay) { var n = parseFloat(String(d.retryDelay)); if (isFinite(n)) retrySec = Math.round(n); }
      });
    } catch (e) {}
    if (status === 400 && /api key not valid|API_KEY_INVALID/i.test(msg)) return aiError("bad_key", "المفتاح غير صالح — تأكد من نسخه كاملًا من Google AI Studio.");
    if (status === 401 || status === 403) return aiError("bad_key", "المفتاح مرفوض (403) — تحقّق من صلاحيته ومن قيود الاستخدام في AI Studio.");
    if (status === 404) return aiError("no_model", "النموذج «" + modelName + "» غير متاح — اختر نموذجًا آخر من الإعدادات.", { model: modelName });
    if (status === 429) {
      var when = retrySec == null ? "بعد قليل" : retrySec >= 3600 ? "بعد ~" + Math.ceil(retrySec / 3600) + " ساعة" : retrySec >= 60 ? "بعد ~" + Math.ceil(retrySec / 60) + " دقيقة" : "بعد " + retrySec + " ثانية";
      return aiError("quota", "نفد حدّ الطبقة المجانية لنموذج «" + modelName + "» مؤقتًا (يعود " + when + ").", { model: modelName, retrySec: retrySec == null ? 60 : retrySec });
    }
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
      return rankModels(names);
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

  // Models whose free quota is exhausted are skipped until Google's retry time.
  function cooldowns() { return cfg.cooldown || {}; }
  function markExhausted(m, sec) {
    cfg.cooldown = cooldowns(); cfg.cooldown[m] = Date.now() + Math.max(60, sec || 60) * 1000; saveCfg();
  }
  function inCooldown(m) { var t = cooldowns()[m]; return !!(t && t > Date.now()); }

  // Preferred model first, then the key's other models in a sensible order
  // (lite flash models have the roomiest free tiers), then static names.
  function modelCandidates() {
    var candidates = [model()].concat(rankModels(cfg.models || []), STATIC_FALLBACKS);
    var seen = {};
    return candidates.filter(function (m) { if (!m || seen[m]) return false; seen[m] = 1; return true; });
  }

  // Shared retry policy for one call: 404 → next model; 429 → remember the
  // cooldown and try the next model; "thinking" rejected → retry without it.
  function withFallback(candidates, run) {
    var firstQuota = null;
    function attempt(idx, withThinking) {
      while (idx < candidates.length && inCooldown(candidates[idx])) idx++;
      if (idx >= candidates.length) {
        if (firstQuota) { firstQuota.ar += " جرّبتُ النماذج البديلة أيضًا — استخدم مسار النسخ إلى Claude أو أنشئ مفتاحًا من مشروع Google Cloud جديد."; firstQuota.message = firstQuota.ar; return Promise.reject(firstQuota); }
        return Promise.reject(aiError("no_model", "لا يوجد نموذج Gemini متاح لهذا المفتاح الآن — افتح الإعدادات واختر نموذجًا."));
      }
      var m = candidates[idx];
      return run(m, withThinking).catch(function (err) {
        if (err && err.code === "no_model") return attempt(idx + 1, withThinking);
        if (err && err.code === "quota") { markExhausted(m, err.extra && err.extra.retrySec); if (!firstQuota) firstQuota = err; return attempt(idx + 1, withThinking); }
        if (err && err.code === "bad_request" && withThinking && /thinking/i.test(err.message || "")) return attempt(idx, false);
        throw err;
      });
    }
    return attempt(0, true);
  }

  // Multi-turn plain-text chat. history: [{ role: "user" | "model", text }].
  // Same model fallback as generateJSON; the last 24 turns are sent.
  function chat(history, system, opts) {
    opts = opts || {};
    var contents = (history || []).slice(-24).map(function (h) {
      return { role: h.role === "model" ? "model" : "user", parts: [{ text: String(h.text || "") }] };
    });
    if (!contents.length) return Promise.reject(aiError("bad_request", "لا رسالة لإرسالها."));
    return withFallback(modelCandidates(), function (m, withThinking) {
      var gen = { temperature: opts.temperature != null ? opts.temperature : 0.7, maxOutputTokens: opts.maxOutputTokens || 1024 };
      if (withThinking && /2\.5/.test(m)) gen.thinkingConfig = { thinkingBudget: 0 };
      var body = { contents: contents, generationConfig: gen };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      return request("/models/" + encodeURIComponent(m) + ":generateContent", { method: "POST", body: body, modelName: m })
        .then(function (data) { var t = extractText(data).trim(); lastUsedModel = m; return t; });
    });
  }
  var lastUsedModel = null;

  // One JSON-mode call. Tries the configured model, then the known fallbacks
  // on "model not found"; drops thinkingConfig if the model rejects it.
  // prompt: a string, or an array of parts (text and inlineData audio) for
  // listening tasks — every Gemini 2.x/3.x flash model accepts audio input.
  function generateJSON(prompt, schema, opts) {
    opts = opts || {};
    var parts = Array.isArray(prompt) ? prompt : [{ text: prompt }];
    return withFallback(modelCandidates(), function (m, withThinking) {
      var gen = { responseMimeType: "application/json", temperature: opts.temperature != null ? opts.temperature : 0.2, maxOutputTokens: opts.maxOutputTokens || 8192 };
      if (schema) gen.responseSchema = schema;
      if (withThinking && /2\.5/.test(m)) gen.thinkingConfig = { thinkingBudget: 0 };
      var body = { contents: [{ role: "user", parts: parts }], generationConfig: gen };
      if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
      return request("/models/" + encodeURIComponent(m) + ":generateContent", { method: "POST", body: body, modelName: m })
        .then(function (data) {
          var text = extractText(data);
          var obj = null;
          try { obj = JSON.parse(text); } catch (e) { obj = window.Prompts && window.Prompts.parseJSON ? window.Prompts.parseJSON(text) : null; }
          if (!obj) throw aiError("parse", "تعذّر قراءة ردّ النموذج كبيانات — جرّب مرة أخرى أو الصق الردّ يدويًا.", { raw: text });
          obj.__model = m; lastUsedModel = m;
          return obj;
        });
    });
  }

  /* =================================================================
     Claude (Anthropic Messages API, raw HTTP from the browser)
     ================================================================= */

  var C_CFG_KEY = "ielts_claude_cfg";
  var C_BASE = "https://api.anthropic.com/v1";
  var C_VERSION = "2026-10-21";
  var C_DEFAULT = "claude-opus-5-5";
  var C_MODELS = [
    { id: "claude-opus-5-5",   ar: "Claude Opus 5.5 — الافتراضي: أدقّ تقييم" },
    { id: "claude-sonnet-5-5", ar: "Claude Sonnet 5.5 — أسرع وبنصف التكلفة" },
    { id: "claude-haiku-5-5",  ar: "Claude Haiku 5.5 — الأسرع والأرخص جدًا" },
    { id: "claude-fable-5-1",  ar: "Claude Fable 5.1 — الأقدر والأغلى" }
  ];
  // Models that take the server-side refusal fallback ("default" routing).
  var C_FALLBACKS = { "claude-opus-5-5": 1, "claude-fable-5-1": 1, "claude-sonnet-5-5": 1, "claude-opus-5": 1 };

  function loadC() { try { return JSON.parse(localStorage.getItem(C_CFG_KEY)) || {}; } catch (e) { return {}; } }
  var ccfg = loadC();   // { key, model, enabled, models: [...], lastOk }
  function saveC() { try { localStorage.setItem(C_CFG_KEY, JSON.stringify(ccfg)); } catch (e) {} }
  function cEnabled() { return !!(ccfg.enabled && ccfg.key); }
  function cModel() { return ccfg.model || C_DEFAULT; }

  function cHeaders(key, beta) {
    var h = { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": C_VERSION,
              "anthropic-dangerous-direct-browser-access": "true" };   // CORS for a single-user app on the user's own device
    if (beta) h["anthropic-beta"] = beta;
    return h;
  }

  function cMapError(status, body, retryAfter, modelName) {
    var type = (body && body.error && body.error.type) || "", msg = (body && body.error && body.error.message) || "";
    var wait = retryAfter ? (retryAfter >= 60 ? "بعد ~" + Math.ceil(retryAfter / 60) + " دقيقة" : "بعد " + retryAfter + " ثانية") : "بعد لحظات";
    if (status === 401 || type === "authentication_error") return aiError("bad_key", "مفتاح Claude غير صالح — انسخه كاملًا من console.anthropic.com (يبدأ بـ sk-ant-).");
    if (status === 402 || type === "billing_error") return aiError("billing", "لا يوجد رصيد كافٍ في حساب Claude API — راجع console.anthropic.com ▸ Billing.");
    if (status === 403 || type === "permission_error") return aiError("bad_key", "مفتاح Claude لا يملك صلاحية لهذا الطلب — راجع إعدادات المفتاح في console.anthropic.com.");
    if (status === 404 || type === "not_found_error") return aiError("no_model", "النموذج «" + modelName + "» غير متاح لهذا المفتاح — اختر نموذجًا آخر من «الخطة».", { model: modelName });
    if (status === 429 || type === "rate_limit_error") return aiError("quota", "تجاوزت حدّ طلبات Claude مؤقتًا — أعد المحاولة " + wait + ".", { retrySec: retryAfter || 30 });
    if (status === 529 || type === "overloaded_error") return aiError("overloaded", "Claude مزدحم الآن — أعد المحاولة " + wait + ".", { retrySec: retryAfter || 5 });
    if (status >= 500) return aiError("server", "خدمة Claude غير متاحة حاليًا (" + status + ") — حاول بعد قليل.", { retrySec: retryAfter || 5 });
    if (status === 400) return aiError("bad_request", "طلب مرفوض من Claude: " + (msg ? msg.slice(0, 200) : "تحقّق من الإعدادات."));
    return aiError("http", "خطأ من Claude (" + status + ")" + (msg ? ": " + msg.slice(0, 160) : ""));
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // One HTTP call; retries 429/529/5xx twice when the wait is short (as the SDK does).
  function cRequest(path, opts, keyOverride, attempt) {
    var key = keyOverride || ccfg.key;
    attempt = attempt || 0;
    if (!key) return Promise.reject(aiError("no_key", "لم يُضبط مفتاح Claude بعد — أضفه من «الخطة» ▸ الذكاء الاصطناعي."));
    if (typeof navigator !== "undefined" && navigator.onLine === false)
      return Promise.reject(aiError("offline", "لا يوجد اتصال بالإنترنت — استخدم مسار النسخ إلى Claude أو الإدخال اليدوي."));
    opts = opts || {};
    return fetch(C_BASE + path, { method: opts.method || "GET", headers: cHeaders(key, opts.beta),
                                  body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        return r.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
          if (r.ok) return data;
          var ra = parseInt(r.headers.get("retry-after") || "", 10);
          var err = cMapError(r.status, data, isFinite(ra) ? ra : null, opts.modelName || cModel());
          var retryable = err.code === "quota" || err.code === "overloaded" || err.code === "server";
          if (retryable && attempt < 2 && (err.extra.retrySec || 0) <= 20)
            return sleep(1000 * Math.max(2, err.extra.retrySec || 2) * (attempt + 1)).then(function () { return cRequest(path, opts, keyOverride, attempt + 1); });
          throw err;
        });
      }, function () {
        throw aiError("network", "تعذّر الوصول إلى Claude — تحقّق من الاتصال.");
      });
  }

  function cListModels(keyOverride) {
    return cRequest("/models?limit=100", {}, keyOverride).then(function (data) {
      return ((data && data.data) || []).map(function (m) { return m.id; }).filter(function (id) { return /^claude-/.test(id); });
    });
  }

  function cEnable(key, chosen) {
    key = String(key || "").trim();
    if (!key) return Promise.reject(aiError("no_key", "الصق المفتاح أولًا."));
    if (!/^sk-ant-/.test(key)) return Promise.reject(aiError("bad_key", "هذا ليس مفتاح Claude — مفتاح Claude يبدأ بـ sk-ant- (مفتاح Gemini يبدأ بـ AIza ومكانه الصندوق الآخر)."));
    return cListModels(key).then(function (ids) {
      var m = chosen || ccfg.model || C_DEFAULT;
      if (ids.length && ids.indexOf(m) === -1) {
        var known = C_MODELS.filter(function (x) { return ids.indexOf(x.id) !== -1; })[0];
        m = known ? known.id : ids[0];
      }
      ccfg = { key: key, model: m, enabled: true, models: ids, lastOk: new Date().toISOString() };
      saveC();
      return { model: m, models: ids };
    });
  }
  function cDisable() { ccfg = {}; saveC(); }
  function cSetModel(m) { if (m) { ccfg.model = m; saveC(); } }

  // POST /v1/messages; returns { text, data }. Thinking stays adaptive (always on
  // for these models); `effort` controls depth and speed.
  function cMessages(body) {
    var m = body.model, beta = null;
    if (C_FALLBACKS[m]) { beta = "server-side-fallback-2026-07-01"; body.fallbacks = "default"; }
    return cRequest("/messages", { method: "POST", body: body, beta: beta, modelName: m }).then(function (data) {
      if (!data) throw aiError("empty", "لم يُرجع Claude أي محتوى.");
      if (data.stop_reason === "refusal") throw aiError("blocked", "اعتذر Claude عن هذا الطلب — أعد صياغته، أو اختر Gemini من «الخطة».");
      var text = (data.content || []).filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text || ""; }).join("");
      if (data.stop_reason === "max_tokens" && !text) throw aiError("too_long", "الرد تجاوز الحد — أعد المحاولة أو قصّر النص.");
      lastUsedModel = data.model || m;
      return { text: text, data: data };
    });
  }

  function claudeChat(history, system, opts) {
    opts = opts || {};
    var msgs = (history || []).slice(-24).map(function (h) {
      return { role: h.role === "model" ? "assistant" : "user", content: String(h.text || "") };
    });
    while (msgs.length && msgs[0].role !== "user") msgs.shift();   // the API needs a user turn first
    if (!msgs.length) return Promise.reject(aiError("bad_request", "لا رسالة لإرسالها."));
    var body = { model: cModel(), max_tokens: opts.maxTokens || 4096, messages: msgs,
                 output_config: { effort: opts.effort || "low" } };          // short, spoken-length tutor turns
    if (system) body.system = system;
    return cMessages(body).then(function (r) { return r.text.trim(); });
  }

  // Gemini OpenAPI-subset schema → JSON Schema for structured outputs
  // (lowercase types; every object closed with additionalProperties:false).
  function toJsonSchema(s) {
    if (!s || typeof s !== "object") return s;
    var t = String(s.type || "").toLowerCase(), out = {};
    if (t) out.type = t;
    if (s.enum) out.enum = s.enum.slice();
    if (t === "object") {
      out.properties = {};
      Object.keys(s.properties || {}).forEach(function (k) { out.properties[k] = toJsonSchema(s.properties[k]); });
      out.required = (s.required || []).slice();
      out.additionalProperties = false;
    }
    if (t === "array" && s.items) out.items = toJsonSchema(s.items);
    return out;
  }

  function parseObj(text) {
    try { return JSON.parse(text); } catch (e) {}
    return window.Prompts && window.Prompts.parseJSON ? window.Prompts.parseJSON(text) : null;
  }

  // JSON task: structured outputs first; if the API rejects the schema, retry
  // once as plain text and parse the JSON out of the reply.
  function claudeJSON(promptText, schema, opts) {
    opts = opts || {};
    function body(withFormat) {
      var oc = { effort: opts.effort || "high" };
      if (withFormat && schema) oc.format = { type: "json_schema", schema: toJsonSchema(schema) };
      var b = { model: cModel(), max_tokens: opts.maxTokens || 16000, messages: [{ role: "user", content: promptText }], output_config: oc };
      if (opts.system) b.system = opts.system;
      return b;
    }
    function done(r) {
      var obj = parseObj(r.text);
      if (!obj) throw aiError("parse", "تعذّر قراءة ردّ Claude كبيانات — جرّب مرة أخرى أو الصق الردّ يدويًا.", { raw: r.text });
      obj.__model = lastUsedModel;
      return obj;
    }
    return cMessages(body(true)).then(done, function (err) {
      if (err && err.code === "bad_request" && /schema|format|output_config/i.test(err.message || "")) return cMessages(body(false)).then(done);
      throw err;
    });
  }

  /* =================================================================
     Routing: which provider serves a call
     ================================================================= */

  var PREF_KEY = "ielts_ai_pref";   // "auto" | "claude" | "gemini"
  function pref() { try { return localStorage.getItem(PREF_KEY) || "auto"; } catch (e) { return "auto"; } }
  function setPref(p) { try { localStorage.setItem(PREF_KEY, p || "auto"); } catch (e) {} }

  // The text provider: the user's choice when its key is set, else Claude, else Gemini.
  function provider() {
    var p = pref();
    if (p === "gemini" && enabled()) return "gemini";
    if (p === "claude" && cEnabled()) return "claude";
    return cEnabled() ? "claude" : enabled() ? "gemini" : null;
  }
  function anyEnabled() { return !!provider(); }
  function hasAudio(parts) { return Array.isArray(parts) && parts.some(function (p) { return p && p.inlineData; }); }

  function routeChat(history, system, opts) {
    if (provider() === "claude") return claudeChat(history, system, opts);
    if (provider() === "gemini") return chat(history, system, opts);
    return Promise.reject(aiError("no_key", "فعّل Claude أو Gemini من «الخطة» ▸ الذكاء الاصطناعي."));
  }

  function routeJSON(prompt, schema, opts) {
    if (hasAudio(prompt)) {   // only Gemini can listen
      if (enabled()) return generateJSON(prompt, schema, opts);
      return Promise.reject(aiError("no_audio", "تقييم الصوت يحتاج مفتاح Gemini (مجاني) — Claude لا يسمع الصوت. أضِفه من «الخطة» ▸ الذكاء الاصطناعي."));
    }
    if (provider() === "claude") {
      var text = Array.isArray(prompt) ? prompt.map(function (p) { return p.text || ""; }).join("\n") : prompt;
      return claudeJSON(text, schema, opts);
    }
    if (provider() === "gemini") return generateJSON(prompt, schema, opts);
    return Promise.reject(aiError("no_key", "فعّل Claude أو Gemini من «الخطة» ▸ الذكاء الاصطناعي."));
  }

  /* ---------------- high-level tasks ---------------- */

  function evaluateWriting(args) {
    var Pr = window.Prompts;
    var prompt = Pr.writing(args.essay, args.prompt, { task: args.task, minutes: args.minutes, forAI: true });
    var src = provider();
    return routeJSON(prompt, Pr.schemas.writing).then(function (obj) {
      var ev = Pr.normalize.writing(obj, args.task);
      if (!ev) throw aiError("parse", "الردّ لا يحوي درجات صالحة — أعد المحاولة.", { raw: JSON.stringify(obj).slice(0, 500) });
      ev.model = obj.__model; ev.source = src; ev.ts = new Date().toISOString();
      return ev;
    });
  }

  function evaluateSpeakingTranscript(args) {
    var Pr = window.Prompts;
    var prompt = Pr.speakingTranscript(args.transcript, args.part, { forAI: true });
    var src = provider();
    return routeJSON(prompt, Pr.schemas.speaking).then(function (obj) {
      var ev = Pr.normalize.speaking(obj);
      if (!ev) throw aiError("parse", "الردّ لا يحوي درجات صالحة — أعد المحاولة.");
      ev.model = obj.__model; ev.source = src; ev.ts = new Date().toISOString();
      return ev;
    });
  }

  function weeklyReport(pack) {
    var Pr = window.Prompts;
    var prompt = Pr.weeklyReport(pack, { forAI: true });
    var src = provider();
    return routeJSON(prompt, Pr.schemas.report, { maxOutputTokens: 8192 }).then(function (obj) {
      var rep = Pr.normalize.report(obj);
      if (!rep) throw aiError("parse", "الردّ لا يطابق شكل التقرير — أعد المحاولة.");
      rep.model = obj.__model; rep.source = src;
      return rep;
    });
  }

  var LABEL = { claude: "Claude", gemini: "Gemini" };

  window.AI = {
    // text features (any provider) vs listening features (Gemini only)
    enabled: anyEnabled, audioEnabled: enabled, provider: provider,
    providerLabel: function () { return LABEL[provider()] || "AI"; },
    model: function () { return provider() === "claude" ? cModel() : model(); },
    preference: pref, setPreference: setPref,
    lastUsedModel: function () { return lastUsedModel; },
    generateJSON: routeJSON, chat: routeChat,
    evaluateWriting: evaluateWriting, evaluateSpeakingTranscript: evaluateSpeakingTranscript, weeklyReport: weeklyReport,
    gemini: {
      enabled: enabled, model: model, models: function () { return cfg.models || []; },
      enable: enable, disable: disable, setModel: setModel, listModels: listModels, lastOk: function () { return cfg.lastOk || null; },
      cooldowns: function () { var c = cooldowns(), out = {}; Object.keys(c).forEach(function (m) { if (c[m] > Date.now()) out[m] = c[m]; }); return out; },
      clearCooldowns: function () { cfg.cooldown = {}; saveCfg(); }
    },
    claude: {
      enabled: cEnabled, model: cModel, models: function () { return ccfg.models || []; }, catalog: C_MODELS,
      enable: cEnable, disable: cDisable, setModel: cSetModel, lastOk: function () { return ccfg.lastOk || null; }
    },
    _toJsonSchema: toJsonSchema
  };
})();
