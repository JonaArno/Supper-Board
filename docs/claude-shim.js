/*
 * Demo shim for Supper Board.
 *
 * The real board runs as a Claude artifact, where `window.claude.use("db")`
 * returns a shared, live database. This file fakes just enough of that API
 * so the page works on its own (GitHub Pages, or opened from disk) with
 * sample data. Changes are kept in this browser's localStorage only.
 */
(function () {
  "use strict";

  var STORE_KEY = "supper-board-demo-v1";

  // ---------- dates ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function keyOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function mondayOfThisWeek() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var dow = (d.getDay() + 6) % 7; // Mon=0
    d.setDate(d.getDate() - dow);
    return d;
  }
  function dayKey(start, offset) { var d = new Date(start); d.setDate(d.getDate() + offset); return keyOf(d); }

  // ---------- seed ----------
  function buildSeed() {
    var S = window.SUPPER_SEED;
    var start = mondayOfThisWeek();
    var todayKey = keyOf(new Date());
    var docs = {};
    S.meals.forEach(function (m) {
      var copy = JSON.parse(JSON.stringify(m));
      var off = copy.day; delete copy.day;
      copy.date = dayKey(start, off);
      if (copy.date >= todayKey) { delete copy.rating; }
      docs["meals/" + copy.id] = copy;
    });
    S.notes.forEach(function (n) { docs["notes/" + n.id] = Object.assign({ at: new Date().toISOString() }, n); });
    ["grocery", "staples", "freezer", "ideas"].forEach(function (c) {
      (S[c] || []).forEach(function (x) { docs[c + "/" + x.id] = Object.assign({ at: new Date().toISOString() }, x); });
    });
    var plan = JSON.parse(JSON.stringify(S.plan));
    plan.start = dayKey(start, 0);
    plan.end = dayKey(start, 13);
    docs["plan/current"] = plan;
    Object.keys(docs).forEach(function (k) { var o = docs[k]; delete o.id; });
    return { seededFor: keyOf(start), docs: docs };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.seededFor === keyOf(mondayOfThisWeek())) return parsed;
      }
    } catch (e) {}
    return buildSeed();
  }
  var state = load();
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  // ---------- snapshots & listeners ----------
  var listeners = []; // {kind:"doc"|"col", path, next}
  function freeze(o) { return JSON.parse(JSON.stringify(o)); }
  function docSnap(path) {
    var data = state.docs[path];
    var id = path.split("/").pop();
    return {
      id: id, exists: !!data,
      data: function () { return data ? freeze(data) : undefined; },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function colSnap(path) {
    var prefix = path + "/";
    var docs = Object.keys(state.docs)
      .filter(function (k) { return k.indexOf(prefix) === 0 && k.slice(prefix.length).indexOf("/") === -1; })
      .sort()
      .map(docSnap);
    return {
      docs: docs, size: docs.length, empty: !docs.length,
      docChanges: function () { return docs.map(function (d, i) { return { type: "added", doc: d, oldIndex: -1, newIndex: i }; }); },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function notify(changedPath) {
    var parent = changedPath.split("/").slice(0, -1).join("/");
    listeners.forEach(function (l) {
      if (l.kind === "doc" && l.path === changedPath) setTimeout(function () { l.next(docSnap(l.path)); }, 0);
      if (l.kind === "col" && l.path === parent) setTimeout(function () { l.next(colSnap(l.path)); }, 0);
    });
  }
  function merge(target, src) {
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v) && v.__delete__ === true) { delete target[k]; return; }
      if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) {
        merge(target[k], v);
      } else {
        target[k] = freeze(v);
      }
    });
  }
  function reject(code, message) { return Promise.reject({ code: code, message: message }); }

  // ---------- refs ----------
  function docRef(path) {
    return {
      id: path.split("/").pop(),
      path: path,
      get: function () { return Promise.resolve(docSnap(path)); },
      set: function (data) { state.docs[path] = freeze(data); persist(); notify(path); return Promise.resolve(); },
      update: function (data) {
        if (!state.docs[path]) return reject("invalid_argument", "Document does not exist: " + path);
        merge(state.docs[path], data); persist(); notify(path); return Promise.resolve();
      },
      delete: function () { delete state.docs[path]; persist(); notify(path); return Promise.resolve(); },
      onSnapshot: function (next) {
        var l = { kind: "doc", path: path, next: next }; listeners.push(l);
        setTimeout(function () { next(docSnap(path)); }, 0);
        return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
      },
      collection: function (sub) { return colRef(path + "/" + sub); }
    };
  }
  function colRef(path) {
    return {
      path: path,
      doc: function (id) { return docRef(path + "/" + (id || Math.random().toString(36).slice(2, 12))); },
      add: function (data) { var r = this.doc(); return r.set(data).then(function () { return r; }); },
      get: function () { return Promise.resolve(colSnap(path)); },
      onSnapshot: function (next) {
        var l = { kind: "col", path: path, next: next }; listeners.push(l);
        setTimeout(function () { next(colSnap(path)); }, 0);
        return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
      }
    };
  }

  var db = {
    doc: function (p) { return docRef(p); },
    collection: function (p) { return colRef(p); }
  };
  var user = {
    isOwner: function () { return Promise.resolve(true); },
    canEdit: function () { return Promise.resolve(true); },
    can: function () { return Promise.resolve(true); },
    id: function () { return Promise.resolve("u_demo"); }
  };

  window.claude = {
    use: function (name) {
      if (name === "db") return Promise.resolve(db);
      if (name === "user") return Promise.resolve(user);
      return Promise.resolve(null);
    }
  };

  // ---------- demo banner ----------
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.setAttribute("role", "note");
    bar.style.cssText = "background:var(--honey-soft,#FCEEC2);color:var(--ink,#2C1D15);font-size:14px;padding:8px 16px;text-align:center;line-height:1.4";
    bar.innerHTML = "Demo with sample data. Edits are saved only in this browser. ";
    var reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset demo";
    reset.style.cssText = "border:0;background:transparent;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;color:inherit;padding:0";
    reset.addEventListener("click", function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      location.reload();
    });
    bar.appendChild(reset);
    document.body.insertBefore(bar, document.body.firstChild);
    // On wide screens the board pins its tabs to the top of the page; push
    // them down by the banner's height so they don't sit on top of it.
    var style = document.createElement("style");
    document.head.appendChild(style);
    function fit() {
      style.textContent = "@media (min-width:960px){.nav{top:calc(env(safe-area-inset-top,0px) + 44px + " + bar.offsetHeight + "px)!important}}";
    }
    fit();
    window.addEventListener("resize", fit);
  });
})();
