/* bump.js — ONE command to release: bumps CACHE_VERSION in sw.js and stamps
   every script/style/data URL with ?v=N (index.html, sw.js ASSETS, and the
   module loader via window.ASSET_VERSION). Why: GitHub Pages' CDN caches each
   URL for ~10 minutes and installed PWAs cache by URL — a new query string is
   a new URL, so devices get the new file immediately after a deploy.
   Run before committing:  node bump.js   */
const fs = require("fs");

let sw = fs.readFileSync("sw.js", "utf8");
const m = sw.match(/CACHE_VERSION = "ielts-trainer-v(\d+)"/);
if (!m) throw new Error("CACHE_VERSION not found in sw.js");
const n = Number(m[1]) + 1;
sw = sw.replace(m[0], `CACHE_VERSION = "ielts-trainer-v${n}"`);
// stamp asset entries (not the page itself, icons or the manifest)
sw = sw.replace(/"\.\/([^"?]+)(\?v=\d+)?"/g, (s, p) =>
  (p === "index.html" || /\.(png|webmanifest)$/.test(p)) ? `"./${p}"` : `"./${p}?v=${n}"`);
fs.writeFileSync("sw.js", sw);

let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/(src|href)="((?:js|data|css)\/[^"?]+)(\?v=\d+)?"/g, (s, a, p) => `${a}="${p}?v=${n}"`);
if (/window\.ASSET_VERSION = "\d+"/.test(html)) html = html.replace(/window\.ASSET_VERSION = "\d+"/, `window.ASSET_VERSION = "${n}"`);
else html = html.replace("<!-- Data banks:", `<script>window.ASSET_VERSION = "${n}";</script>\n  <!-- Data banks:`);
fs.writeFileSync("index.html", html);

console.log("bumped to v" + n + " — index.html, sw.js stamped");
