// Student page: pick your name, then pick an elective while seats last.
import { configured, auth, r, onAuthStateChanged, signInAnonymously, onValue, update, serverTimestamp } from "./fb.js";
import { $, esc, normKey, showOnly } from "./ui.js";
import { TERM, TERM_LABEL, GRADES, bandOf, gradeName, BAND_NAME } from "./electives-config.js";

const SCREENS = ["e-setup", "e-loading", "e-msg", "e-who", "e-pick", "e-confirm", "e-done"];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const KEY = "el." + TERM;
$("#termLabel").textContent = `${TERM_LABEL} electives`;

let uid = null, data = null, grade = null, sid = store.get(KEY) || null, choosing = null, busy = false, screen = "";

if (!configured) { window.__elReady = true; showOnly(SCREENS, "e-setup"); }
else onAuthStateChanged(auth, async u => {
  if (!u) { try { await signInAnonymously(auth); } catch (e) { msg("Couldn't connect", "Check the internet connection and reload the page."); } return; }
  if (uid) return;
  uid = u.uid;
  onValue(r("electives/" + TERM), s => { window.__elReady = true; data = s.val() || {}; render(); }, () => { window.__elReady = true; msg("Couldn't load the electives", "Reload the page. If it keeps happening, tell your teacher."); });
});

function msg(title, text) { show("e-msg"); $("#msgTitle").textContent = title; $("#msgText").textContent = text; }
function show(id) { if (screen !== id) { showOnly(SCREENS, id); screen = id; } }

/* ---------- helpers on the live data ---------- */
const classes = () => Object.entries(data.classes || {}).map(([id, c]) => ({ id, ...c })).sort((a, b) => (a.order || 0) - (b.order || 0));
const roster = () => data.roster || {};
const choices = () => data.choices || {};
function poolFor(c, band) { return Object.entries(c.pools || {}).find(([, p]) => p.bands && p.bands[band]); }
function seatsOf(cls, pool) {
  const s = ((data.seats || {})[cls] || {})[pool] || {};
  const keys = Object.keys(s).sort();
  return { total: keys.length, free: keys.filter(k => !s[k].sid) };
}

/* ---------- render ---------- */
function render() {
  if (!data) return;
  if (!data.config || !data.classes) return msg("Sign-ups haven't started yet", "Check back when your teacher tells you.");
  // already signed up on this device?
  if (sid && choices()[sid]) return showDone(sid);
  if (sid && !choices()[sid]) { sid = null; store.del(KEY); }
  if (!data.config.open) return msg("Sign-ups are closed", "Ask your teacher if you still need to choose an elective.");
  if (choosing) {
    // the class they were about to confirm filled up meanwhile
    if (screen === "e-confirm" && !busy && !seatsOf(choosing.cls, choosing.pool).free.length) {
      choosing = null; renderPick(); $("#pickSub").textContent = "That class just filled up. Choose another one."; return;
    }
    if (screen === "e-confirm") return;
  }
  if (grade !== null && screen === "e-pick" && pickedSid) return renderPick();
  renderWho();
}

let pickedSid = null;
function renderWho() {
  show("e-who");
  const seg = $("#gradeSeg");
  const html = GRADES.map(g => `<button type="button" data-g="${g}" aria-pressed="${g === grade}">${gradeName(g).replace(" grade", "")}</button>`).join("");
  if (seg.dataset.html !== html) { seg.innerHTML = html; seg.dataset.html = html; }
  $("#nameWrap").hidden = grade === null;
  if (grade === null) return;
  const f = normKey($("#nameFilter").value || "");
  const list = Object.entries(roster()).filter(([, p]) => Number(p.grade) === grade).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const shown = list.filter(([, p]) => !f || normKey(p.name).includes(f));
  const ch = choices();
  const h = shown.length ? shown.map(([id, p]) => ch[id]
    ? `<button type="button" class="el-name" disabled>${esc(p.name)} <span class="sub">· already chose</span></button>`
    : `<button type="button" class="el-name" data-sid="${esc(id)}">${esc(p.name)}</button>`).join("")
    : `<p class="sub">${list.length ? "No name matches that search." : `No students listed for ${gradeName(grade)} yet.`}</p>`;
  const box = $("#nameList");
  if (box.dataset.html !== h) { box.innerHTML = h; box.dataset.html = h; }
}

function renderPick() {
  const p = roster()[pickedSid];
  if (!p || choices()[pickedSid]) { pickedSid = null; return renderWho(); }
  show("e-pick");
  const band = bandOf(p.grade);
  $("#pickName").textContent = p.name;
  if (!$("#pickSub").dataset.keep) $("#pickSub").textContent = `${gradeName(p.grade)} · these are the electives open to ${BAND_NAME[band]} grade.`;
  const cards = classes().map(c => {
    const pe = poolFor(c, band);
    if (!pe) return "";
    const { total, free } = seatsOf(c.id, pe[0]);
    const full = free.length === 0;
    const shared = Object.keys(c.pools || {}).length > 1;
    const pct = total ? Math.round(100 * (total - free.length) / total) : 100;
    return `<div class="el-card${full ? " full" : ""}">
      <div><h2>${esc(c.name)}</h2><p class="sub">${esc(c.who || "")}</p></div>
      <div><div class="el-meter"><i style="width:${pct}%"></i></div>
        <p class="el-left">${full ? "<b>Full</b>. No more seats." : `<b>${free.length}</b> of ${total} seats left${shared ? ` for ${BAND_NAME[band]} grade` : ""}`}</p></div>
      <button type="button" class="${full ? "ghost" : "go"}" data-pick="${esc(c.id)}" data-pool="${esc(pe[0])}" ${full ? "disabled" : ""}>${full ? "Full" : "Choose"}</button>
    </div>`;
  }).join("");
  const box = $("#classList");
  if (box.dataset.html !== cards) { box.innerHTML = cards || `<p class="sub">No electives are open to your grade.</p>`; box.dataset.html = cards; }
}

function showDone(id) {
  show("e-done");
  const c = choices()[id], p = roster()[id] || {}, cl = (data.classes || {})[c.cls] || {};
  $("#doneClass").textContent = cl.name || c.cls;
  $("#doneWho").textContent = `${p.name || ""}${p.grade ? ` · ${gradeName(p.grade)}` : ""}`;
}

/* ---------- actions ---------- */
$("#gradeSeg").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  grade = +b.dataset.g; $("#nameFilter").value = ""; $("#nameList").dataset.html = ""; renderWho();
  $("#nameFilter").focus();
});
$("#nameFilter").addEventListener("input", () => renderWho());
$("#nameList").addEventListener("click", e => {
  const b = e.target.closest("[data-sid]"); if (!b) return;
  pickedSid = b.dataset.sid; delete $("#pickSub").dataset.keep; $("#classList").dataset.html = ""; renderPick();
});
$("#notMe").addEventListener("click", () => { pickedSid = null; renderWho(); });
$("#classList").addEventListener("click", e => {
  const b = e.target.closest("[data-pick]"); if (!b || b.disabled) return;
  const c = data.classes[b.dataset.pick], p = roster()[pickedSid];
  choosing = { cls: b.dataset.pick, pool: b.dataset.pool };
  show("e-confirm");
  $("#confClass").textContent = c.name;
  $("#confWho").textContent = `For ${p.name}, ${gradeName(p.grade)}.`;
  $("#confErr").textContent = "";
});
$("#backBtn").addEventListener("click", () => { choosing = null; $("#classList").dataset.html = ""; renderPick(); });
$("#confirmBtn").addEventListener("click", async () => {
  if (busy || !choosing || !pickedSid) return;
  busy = true; $("#confirmBtn").disabled = true; $("#confErr").textContent = "";
  const { cls, pool } = choosing, who = pickedSid;
  let ok = false;
  // Try the free seats one at a time. If someone grabs a seat at the same moment, the
  // database refuses the second write and we move on to the next seat.
  for (const seat of seatsOf(cls, pool).free) {
    const upd = {};
    upd[`seats/${cls}/${pool}/${seat}/sid`] = who;
    upd[`choices/${who}`] = { cls, pool, seat, uid, at: serverTimestamp() };
    try { await update(r("electives/" + TERM), upd); ok = true; break; }
    catch (err) {
      if (choices()[who]) break;            // someone already signed up with this name
      if (!data.config || !data.config.open) break;
    }
  }
  busy = false; $("#confirmBtn").disabled = false;
  if (ok) { sid = who; store.set(KEY, who); choosing = null; pickedSid = null; showDone(who); return; }
  if (choices()[who]) { $("#confErr").textContent = "Someone already signed up with this name. Tell your teacher."; return; }
  if (!data.config || !data.config.open) { $("#confErr").textContent = "Sign-ups just closed. Tell your teacher."; return; }
  choosing = null; $("#pickSub").textContent = "That class just filled up. Choose another one."; $("#pickSub").dataset.keep = "1";
  $("#classList").dataset.html = ""; renderPick();
});
$("#someoneElse").addEventListener("click", () => { sid = null; store.del(KEY); grade = null; pickedSid = null; renderWho(); });
