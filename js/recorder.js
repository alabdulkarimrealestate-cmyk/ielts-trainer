/* recorder.js — microphone → 16 kHz mono WAV (base64) for Gemini audio input.
   Web Audio capture (works in Chrome, Edge, Android, iOS Safari 14.3+) instead
   of MediaRecorder, whose WebM/MP4 output Gemini does not list as supported.
   16 kHz 16-bit mono = 32 KB/s: a 2-minute Part 2 answer is ~3.8 MB, well
   under the 20 MB inline-request limit. Needs HTTPS (or localhost).
   Audio is never stored — only the AI's assessment is saved. */
(function () {
  "use strict";
  var RATE = 16000;
  var cur = null;   // the recording in progress (one at a time)

  function aerr(code, ar) { var e = new Error(ar); e.code = code; e.ar = ar; return e; }

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));
  }
  function unsupportedReason() {
    if (location.protocol === "file:") return "التسجيل يحتاج فتح التطبيق من الرابط (https) — لا يعمل من ملف على الجهاز.";
    if (!window.isSecureContext) return "التسجيل يحتاج اتصالًا آمنًا (https).";
    return "هذا المتصفّح لا يدعم التسجيل — استخدم Chrome أو Edge أو Safari حديثًا.";
  }

  function mapErr(e) {
    var n = e && (e.name || e.code);
    if (n === "NotAllowedError" || n === "SecurityError" || n === "PermissionDeniedError")
      return aerr("denied", "اسمح للمتصفّح باستخدام الميكروفون (من رمز القفل بجانب العنوان) ثم حاول مرة أخرى.");
    if (n === "NotFoundError" || n === "DevicesNotFoundError") return aerr("no_mic", "لم أجد ميكروفونًا متصلًا بالجهاز.");
    if (n === "NotReadableError") return aerr("busy_mic", "الميكروفون مستخدم في تطبيق آخر — أغلقه وحاول مرة أخرى.");
    return e && e.code ? e : aerr("mic", "تعذّر تشغيل الميكروفون.");
  }

  // Average-decimate any input rate to 16 kHz.
  function downsample(buf, inRate) {
    if (inRate === RATE) return buf;
    var ratio = inRate / RATE, n = Math.floor(buf.length / ratio), out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var a = Math.floor(i * ratio), b = Math.min(buf.length, Math.floor((i + 1) * ratio)), s = 0;
      for (var j = a; j < b; j++) s += buf[j];
      out[i] = b > a ? s / (b - a) : 0;
    }
    return out;
  }

  function encodeWAV(samples, rate) {
    var buffer = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buffer);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE");
    str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (var i = 0, o = 44; i < samples.length; i++, o += 2) {
      var s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  function toBase64(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer), parts = [], CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CH)));
    return btoa(parts.join(""));
  }

  // Build the result object from raw float chunks (also used by tests).
  function finish(chunks, length, inRate, heard) {
    var all = new Float32Array(length), o = 0;
    chunks.forEach(function (c) { all.set(c, o); o += c.length; });
    var pcm = downsample(all, inRate);
    var wav = encodeWAV(pcm, RATE);
    var blob = new Blob([wav], { type: "audio/wav" });
    return { base64: toBase64(wav), mime: "audio/wav", blob: blob, url: URL.createObjectURL(blob),
             duration: pcm.length / RATE, heard: !!heard, bytes: wav.byteLength };
  }

  /* start(opts) → Promise<result> that resolves when the recording stops.
     opts: { maxSec, autoStopSilence (seconds of silence after speech),
             onLevel(0..1), onTick(seconds) }                                 */
  function start(opts) {
    opts = opts || {};
    if (cur) return Promise.reject(aerr("busy", "هناك تسجيل قيد التشغيل."));
    if (!supported()) return Promise.reject(aerr("unsupported", unsupportedReason()));
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = new AC();                      // created inside the user's tap (iOS)
    var rec = { ctx: ctx, stream: null, done: false };
    cur = rec;
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
      .then(function (stream) {
        rec.stream = stream;
        return ctx.state === "suspended" ? ctx.resume() : null;
      })
      .then(function () {
        return new Promise(function (resolve, reject) {
          if (rec.done) { reject(aerr("cancelled", "أُلغي التسجيل.")); return; }
          var src = ctx.createMediaStreamSource(rec.stream);
          var node = ctx.createScriptProcessor(4096, 1, 1);
          var chunks = [], length = 0, heard = false, t0 = Date.now(), lastLoud = t0;
          node.onaudioprocess = function (e) {
            if (rec.done) return;
            var d = e.inputBuffer.getChannelData(0);
            chunks.push(new Float32Array(d)); length += d.length;
            var sum = 0; for (var i = 0; i < d.length; i += 4) sum += d[i] * d[i];
            var rms = Math.sqrt(sum / (d.length / 4)), now = Date.now();
            if (opts.onLevel) { try { opts.onLevel(Math.min(1, rms * 7)); } catch (x) {} }
            if (opts.onTick) { try { opts.onTick((now - t0) / 1000); } catch (x) {} }
            if (rms > 0.025) { heard = true; lastLoud = now; }
            if (opts.autoStopSilence && heard && now - lastLoud > opts.autoStopSilence * 1000) rec.stop();
            else if (opts.maxSec && now - t0 > opts.maxSec * 1000) rec.stop();
          };
          src.connect(node); node.connect(ctx.destination);   // output stays silent; needed for onaudioprocess
          function release() {
            try { node.disconnect(); src.disconnect(); } catch (x) {}
            try { rec.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (x) {}
            try { ctx.close(); } catch (x) {}
            if (cur === rec) cur = null;
          }
          rec.stop = function () {
            if (rec.done) return; rec.done = true; release();
            if (!length) { reject(aerr("empty", "لم يُسجَّل شيء.")); return; }
            resolve(finish(chunks, length, ctx.sampleRate, heard));
          };
          rec.cancel = function () { if (rec.done) return; rec.done = true; release(); reject(aerr("cancelled", "أُلغي التسجيل.")); };
        });
      })
      .catch(function (e) {
        rec.done = true;
        try { if (rec.stream) rec.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (x) {}
        try { ctx.close(); } catch (x) {}
        if (cur === rec) cur = null;
        throw (e && (e.code === "cancelled" || e.code === "empty")) ? e : mapErr(e);
      });
  }

  function stop() { if (cur && cur.stop) cur.stop(); }
  function cancel() { if (cur) { if (cur.cancel) cur.cancel(); else { cur.done = true; cur = null; } } }
  function recording() { return !!cur; }

  window.Recorder = { start: start, stop: stop, cancel: cancel, recording: recording, supported: supported,
                      unsupportedReason: unsupportedReason, _finish: finish, _encodeWAV: encodeWAV, RATE: RATE };
})();
