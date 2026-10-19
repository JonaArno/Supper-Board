// Serves Supper Board on Railway (or anywhere Node runs).
//
// The board file stays exactly as written for Claude artifacts. At startup this
// wraps it in a document shell and loads the Supabase adapter first, so the
// board's `window.claude.use("db")` calls go to Supabase instead.
//
// Env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (the public/anon key; never the
// service_role or secret key). PORT is set by Railway.
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_KEY = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

const read = (p) => fs.readFileSync(path.join(ROOT, p));
const supabaseJs = read("node_modules/@supabase/supabase-js/dist/umd/supabase.js");
const adapterJs = read("server/public/claude-supabase.js");
const board = read("board/supper-board.html").toString("utf8");

// JSON inside a <script> tag: escape "<" so a value can never close the tag.
const inlineJson = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FBF4EA">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Supper Board">
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
<script>window.SUPPER_CONFIG = ${inlineJson({ url: SUPABASE_URL, key: SUPABASE_KEY })};</script>
<script src="/vendor/supabase.js"></script>
<script src="/claude-supabase.js"></script>
</head>
<body>
${board}
</body>
</html>
`;

const notConfigured = `<!doctype html><meta charset="utf-8"><title>Supper Board</title>
<body style="font-family:system-ui;max-width:560px;margin:40px auto;padding:0 16px;line-height:1.5">
<h1>Almost there</h1>
<p>Set <code>SUPABASE_URL</code> and <code>SUPABASE_PUBLISHABLE_KEY</code> in this service's Railway variables, then redeploy.</p>
</body>`;

const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);
if (!configured) console.warn("SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is not set; serving setup instructions.");

const routes = {
  "/": () => [configured ? 200 : 503, "text/html; charset=utf-8", configured ? page : notConfigured],
  "/vendor/supabase.js": () => [200, "text/javascript; charset=utf-8", supabaseJs],
  "/claude-supabase.js": () => [200, "text/javascript; charset=utf-8", adapterJs],
  "/healthz": () => [200, "text/plain; charset=utf-8", "ok"],
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const route = routes[url.pathname];
    if (!route || (req.method !== "GET" && req.method !== "HEAD")) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const [status, type, body] = route();
    res.writeHead(status, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "DENY",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  })
  .listen(PORT, () => console.log(`Supper Board listening on port ${PORT}`));
