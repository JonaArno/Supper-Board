/*
 * Supabase adapter for Supper Board.
 *
 * The board is written as a Claude artifact and talks to `window.claude.use("db")`.
 * This file provides that same small API on top of a Supabase table (`public.docs`,
 * one row per document path like "meals/m01"), plus an email sign-in screen.
 * Only emails listed in `public.allowed_emails` can read or write anything; the
 * database enforces that with row-level security, not this file.
 */
(function () {
  "use strict";

  var cfg = window.SUPPER_CONFIG || {};
  var sb = window.supabase.createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function newId() {
    var a = new Uint8Array(10); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return (b % 36).toString(36); }).join("");
  }
  function onDom(fn) {
    if (document.body) fn(); else document.addEventListener("DOMContentLoaded", fn);
  }

  // Translate Supabase errors into the codes the board already handles.
  function mapErr(err) {
    var code = err && err.code;
    var out = { code: "internal", message: (err && err.message) || "Request failed" };
    if (code === "42501") out.code = "invalid_argument";           // row-level security refused it
    else if (code === "P0002") out.code = "not_found";
    else if (!code || /fetch|network|timeout/i.test(out.message)) out.code = "unavailable";
    return out;
  }

  // ---------- reads ----------
  function docSnap(path, data) {
    return {
      id: path.split("/").pop(),
      exists: data !== undefined,
      data: function () { return clone(data); },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function colSnap(rows) {
    var docs = rows.map(function (r) { return docSnap(r.path, r.data); });
    return {
      docs: docs, size: docs.length, empty: !docs.length,
      docChanges: function () { return docs.map(function (d, i) { return { type: "added", doc: d, oldIndex: -1, newIndex: i }; }); },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function fetchDoc(path) {
    return sb.from("docs").select("data").eq("path", path).maybeSingle().then(function (res) {
      if (res.error) throw mapErr(res.error);
      return docSnap(path, res.data ? res.data.data : undefined);
    });
  }
  function fetchCol(name) {
    return sb.from("docs").select("path,data").eq("collection", name).order("path").then(function (res) {
      if (res.error) throw mapErr(res.error);
      return colSnap(res.data || []);
    });
  }

  // ---------- live listeners ----------
  // Each watched doc or collection is re-read whenever something under it changes.
  // Reads for the same key never overlap, so an older answer can't land after a newer one.
  var watches = {}; // key -> {kind, path, subs: Set, running, dirty, timer}
  function watchKey(kind, path) { return kind + ":" + path; }
  function runWatch(w) {
    if (w.running) { w.dirty = true; return; }
    w.running = true; w.dirty = false;
    (w.kind === "doc" ? fetchDoc(w.path) : fetchCol(w.path)).then(function (snap) {
      w.subs.forEach(function (s) { try { s.next(snap); } catch (e) { console.error(e); } });
    }, function (err) {
      w.subs.forEach(function (s) { if (s.error) s.error(err); });
    }).then(function () {
      w.running = false;
      if (w.dirty) runWatch(w);
    });
  }
  function schedule(w) {
    clearTimeout(w.timer);
    w.timer = setTimeout(function () { runWatch(w); }, 40);
  }
  function touched(path) {
    var col = path.split("/")[0];
    Object.keys(watches).forEach(function (k) {
      var w = watches[k];
      if ((w.kind === "doc" && w.path === path) || (w.kind === "col" && w.path === col)) schedule(w);
    });
  }
  function refreshAll() { Object.keys(watches).forEach(function (k) { schedule(watches[k]); }); }
  function subscribe(kind, path, next, error) {
    var key = watchKey(kind, path);
    var w = watches[key] || (watches[key] = { kind: kind, path: path, subs: new Set() });
    var sub = { next: next, error: error };
    w.subs.add(sub);
    schedule(w);
    return function () { w.subs.delete(sub); };
  }

  // ---------- writes ----------
  function after(path) {
    return function (res) {
      if (res.error) throw mapErr(res.error);
      touched(path);
    };
  }
  function docRef(path) {
    return {
      id: path.split("/").pop(),
      path: path,
      get: function () { return fetchDoc(path); },
      set: function (data) {
        return sb.from("docs").upsert({ path: path, data: data, updated_at: new Date().toISOString() }).then(after(path));
      },
      update: function (patch) {
        return sb.rpc("merge_doc", { p_path: path, p_patch: patch }).then(after(path));
      },
      delete: function () {
        return sb.from("docs").delete().eq("path", path).then(after(path));
      },
      onSnapshot: function (next, error) { return subscribe("doc", path, next, error); }
    };
  }
  function colRef(name) {
    return {
      path: name,
      doc: function (id) { return docRef(name + "/" + (id || newId())); },
      add: function (data) { var r = this.doc(); return r.set(data).then(function () { return r; }); },
      get: function () { return fetchCol(name); },
      onSnapshot: function (next, error) { return subscribe("col", name, next, error); }
    };
  }
  var db = Object.freeze({
    doc: function (p) { return docRef(p); },
    collection: function (p) { return colRef(p); }
  });

  // ---------- realtime ----------
  var channel = null;
  function startRealtime() {
    if (channel) return;
    channel = sb.channel("docs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, function (p) {
        var path = (p.new && p.new.path) || (p.old && p.old.path);
        if (path) touched(path); else refreshAll();
      })
      .subscribe(function (status) { if (status === "SUBSCRIBED") refreshAll(); });
    // A phone or wall tablet waking up may have missed changes while asleep.
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refreshAll(); });
    window.addEventListener("online", refreshAll);
  }

  // ---------- sign-in gate ----------
  var resolveDb, dbReady = new Promise(function (r) { resolveDb = r; });
  var currentUser = null, opened = false;

  var gate = null;
  function gateEl() {
    if (gate) return gate;
    var style = document.createElement("style");
    style.textContent =
      "#sbGate{position:fixed;inset:0;z-index:100;background:var(--bg,#FBF4EA);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}" +
      "#sbGate[hidden]{display:none}" +
      "#sbGate .card{width:100%;max-width:400px;background:var(--surface,#FFFCF6);border:1px solid var(--line,#E9D9C6);border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:14px}" +
      "#sbGate h1{font-family:var(--f-display,system-ui);font-size:1.8rem;font-weight:800;margin:0}" +
      "#sbGate p{margin:0;color:var(--muted,#7A6354);font-size:.95rem}" +
      "#sbGate form{display:flex;flex-direction:column;gap:10px}" +
      "#sbGate input{border:1px solid var(--line,#E9D9C6);background:var(--bg,#FBF4EA);border-radius:10px;padding:10px 12px;min-height:44px;font:inherit;color:inherit}" +
      "#sbGate .err{color:var(--danger,#A8382C)}" +
      "#sbGate .linkbtn{border:0;background:transparent;padding:0;font:inherit;font-weight:700;text-decoration:underline;color:var(--ink,#2C1D15);align-self:flex-start;cursor:pointer}";
    document.head.appendChild(style);
    gate = document.createElement("div");
    gate.id = "sbGate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "sbGateTitle");
    gate.hidden = true;
    gate.innerHTML = '<div class="card"><div class="checks" aria-hidden="true" style="margin:0"></div><h1 id="sbGateTitle">Supper Board</h1><div id="sbGateBody"></div></div>';
    document.body.appendChild(gate);
    return gate;
  }
  function render(html) {
    gateEl().hidden = false;
    document.getElementById("sbGateBody").innerHTML = html;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function showEmailForm(msg) {
    render('<p>Sign in with your email. We\'ll send you a link.</p>' +
      (msg ? '<p class="err" role="alert">' + esc(msg) + '</p>' : '') +
      '<form id="sbEmailForm"><input id="sbEmail" type="email" autocomplete="email" required placeholder="you@example.com" aria-label="Email address">' +
      '<button class="btn" type="submit">Send sign-in link</button></form>');
    var f = document.getElementById("sbEmailForm");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("sbEmail").value.trim().toLowerCase();
      if (!email) return;
      var btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Sending…";
      sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } }).then(function (res) {
        if (res.error) {
          var m = /rate/i.test(res.error.message) ? "Too many sign-in emails just now. Wait a few minutes and try again." : res.error.message;
          showEmailForm(m);
        } else showCodeForm(email);
      });
    });
  }
  function showCodeForm(email, msg) {
    render('<p>We sent a sign-in email to <b>' + esc(email) + '</b>. Open the link on this device, or type the code from the email here.</p>' +
      (msg ? '<p class="err" role="alert">' + esc(msg) + '</p>' : '') +
      '<form id="sbCodeForm"><input id="sbCode" inputmode="numeric" autocomplete="one-time-code" placeholder="Code from the email" aria-label="Code from the email">' +
      '<button class="btn" type="submit">Sign in</button></form>' +
      '<button type="button" class="linkbtn" id="sbBack">Use a different email</button>');
    document.getElementById("sbBack").addEventListener("click", function () { showEmailForm(); });
    document.getElementById("sbCodeForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var token = document.getElementById("sbCode").value.replace(/\s+/g, "");
      if (!token) return;
      sb.auth.verifyOtp({ email: email, token: token, type: "email" }).then(function (res) {
        if (res.error) showCodeForm(email, "That code didn't work. Check it, or use the link in the email.");
      });
    });
  }
  function showNotAllowed(email) {
    render('<p class="err" role="alert">' + esc(email) + ' isn\'t on this household\'s list, so the board stays locked.</p>' +
      '<p>Ask whoever set up the board to add this email.</p>' +
      '<button type="button" class="btn ghost" id="sbOut">Sign out</button>');
    document.getElementById("sbOut").addEventListener("click", function () { sb.auth.signOut(); });
  }

  var checking = false;
  function check(session) {
    if (!session) {
      if (opened) { location.reload(); return; } // signed out after the board was open
      onDom(function () { showEmailForm(); });
      return;
    }
    if (opened || checking) return;
    checking = true;
    sb.rpc("is_household").then(function (res) {
      checking = false;
      onDom(function () {
        if (res.error) { showEmailForm("Couldn't reach the board. Check your connection and reload."); return; }
        if (!res.data) { showNotAllowed(session.user.email); return; }
        opened = true;
        currentUser = session.user;
        if (gate) gate.hidden = true;
        startRealtime();
        resolveDb(db);
      });
    });
  }
  // Supabase warns against awaiting its own calls inside this callback, so hop out first.
  sb.auth.onAuthStateChange(function (_event, session) { setTimeout(function () { check(session); }, 0); });

  var user = Object.freeze({
    isOwner: function () { return Promise.resolve(true); },
    canEdit: function () { return Promise.resolve(true); },
    can: function () { return Promise.resolve(true); },
    id: function () { return Promise.resolve(currentUser ? currentUser.id : null); }
  });

  window.claude = Object.freeze({
    use: function (name) {
      if (name === "db") return dbReady;
      if (name === "user") return dbReady.then(function () { return user; });
      return Promise.resolve(null);
    }
  });
})();
