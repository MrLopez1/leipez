// Teacher page for electives: student list, seats, open/close, and placing students by hand.
import {
  configured, auth, r, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  onValue, get, update, push, serverTimestamp
} from "./fb.js";
import { $, esc, normKey, showOnly } from "./ui.js";
import { TERM, TERM_LABEL, CLASSES, GRADES, bandOf, gradeName, BAND_NAME } from "./electives-config.js";

const VIEWS = ["a-setup", "a-loading", "a-signin", "a-denied", "a-main"];
const base = "electives/" + TERM;
const seatKey = n => "s" + String(n).padStart(2, "0");
let user = null, data = {}, unsub = null;
$("#termLabel").textContent = `${TERM_LABEL} · term id ${TERM}`;
$("#studentUrl").textContent = new URL("electives.html", location.href).href;

if (!configured) showOnly(VIEWS, "a-setup");
else onAuthStateChanged(auth, async u => {
  if (unsub) { unsub(); unsub = null; }
  if (!u || u.isAnonymous) { user = null; $("#whoEmail").textContent = ""; $("#signOutBtn").hidden = true; showOnly(VIEWS, "a-signin"); return; }
  user = u; $("#whoEmail").textContent = u.email || ""; $("#signOutBtn").hidden = false;
  try { await get(r("history")); } catch (e) { $("#deniedEmail").textContent = u.email || ""; showOnly(VIEWS, "a-denied"); return; }
  showOnly(VIEWS, "a-main");
  unsub = onValue(r(base), s => { data = s.val() || {}; render(); });
});
$("#googleBtn").addEventListener("click", async () => {
  $("#signinErr").textContent = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { $("#signinErr").textContent = e && e.code === "auth/unauthorized-domain" ? "Add this site's domain in Firebase → Authentication → Settings → Authorized domains." : "Sign-in didn't finish. Try again."; }
});
$("#signOutBtn").addEventListener("click", () => signOut(auth));

/* ---------- reading the data ---------- */
const roster = () => data.roster || {};
const choices = () => data.choices || {};
const classList = () => Object.entries(data.classes || {}).map(([id, c]) => ({ id, ...c })).sort((a, b) => (a.order || 0) - (b.order || 0));
const seatsOf = (cls, pool) => ((data.seats || {})[cls] || {})[pool] || {};
const freeSeats = (cls, pool) => Object.keys(seatsOf(cls, pool)).sort().filter(k => !seatsOf(cls, pool)[k].sid);
const studentsIn = (cls, pool) => Object.entries(choices()).filter(([, c]) => c.cls === cls && c.pool === pool).map(([sid, c]) => ({ sid, ...c, ...(roster()[sid] || { name: "(removed)", grade: "" }) })).sort((a, b) => a.name.localeCompare(b.name));
const poolFor = (c, band) => Object.entries(c.pools || {}).find(([, p]) => p.bands && p.bands[band]);

/* ---------- render ---------- */
function render() {
  const open = !!(data.config && data.config.open), published = !!data.classes;
  $("#openState").textContent = !published ? "Not set up yet" : open ? "Open: students can choose" : "Closed";
  $("#toggleOpen").textContent = open ? "Close sign-ups" : "Open sign-ups";
  $("#toggleOpen").disabled = !published;
  $("#publishBtn").textContent = published ? "Update classes and seats" : "Publish classes and seats";

  const R = roster(), C = choices(), ids = Object.keys(R);
  const chosen = ids.filter(id => C[id]).length;
  let seats = 0, free = 0;
  for (const c of classList()) for (const pool of Object.keys(c.pools || {})) { const s = seatsOf(c.id, pool); seats += Object.keys(s).length; free += freeSeats(c.id, pool).length; }
  $("#stats").innerHTML = [["Students", ids.length], ["Signed up", chosen], ["Still to choose", ids.length - chosen], ["Seats", seats], ["Free seats", free]]
    .map(([k, v]) => `<div class="statchip"><b>${v}</b><span>${k}</span></div>`).join("");

  // capacity warnings
  const warn = [];
  if (!published) warn.push(`Press <b>Publish classes and seats</b> to create the ${CLASSES.length} classes for ${esc(TERM_LABEL)}. Then add your students and open sign-ups.`);
  else {
    const waiting = ids.filter(id => !C[id]);
    if (waiting.length > free) warn.push(`<b>${waiting.length - free} ${waiting.length - free === 1 ? "student" : "students"} won't fit</b>: ${waiting.length} still need a class but only ${free} seats are free. Use <b>+ seat</b> on a class to make room.`);
    for (const band of ["ms", "hs"]) {
      const need = waiting.filter(id => bandOf(R[id].grade) === band).length;
      const can = classList().reduce((a, c) => { const pe = poolFor(c, band); return a + (pe ? freeSeats(c.id, pe[0]).length : 0); }, 0);
      if (need > can) warn.push(`${BAND_NAME[band]} grade: ${need} still need a class, but only ${can} seats are open to them.`);
    }
  }
  $("#warnings").innerHTML = warn.map(w => `<div class="note${w.includes("won't fit") || w.includes("only") ? " bad" : ""}">${w}</div>`).join("");

  // classes
  $("#classAdmin").innerHTML = classList().map(c => `<div class="el-card admin"><div><h2>${esc(c.name)}</h2><p class="sub">${esc(c.who || "")}</p></div>${
    Object.entries(c.pools || {}).map(([pool, p]) => {
      const total = Object.keys(seatsOf(c.id, pool)).length, list = studentsIn(c.id, pool), fr = freeSeats(c.id, pool).length;
      const label = Object.keys(c.pools).length > 1 ? `${BAND_NAME[Object.keys(p.bands || {})[0]] || pool} grade` : "";
      return `<div class="el-pool">
        <div class="row" style="justify-content:space-between;align-items:center;gap:8px"><b>${label ? esc(label) + " · " : ""}${total - fr} of ${total}${fr === 0 && total ? ' <span class="pill bad" style="font-size:12px">Full</span>' : ""}</b>
          <span class="btns"><button class="ghost small" data-seat="-" data-cls="${c.id}" data-pool="${pool}" ${fr ? "" : "disabled"} title="Remove a free seat">− seat</button><button class="ghost small" data-seat="+" data-cls="${c.id}" data-pool="${pool}">+ seat</button></span></div>
        <div class="el-meter"><i style="width:${total ? Math.round(100 * (total - fr) / total) : 0}%"></i></div>
        ${list.length ? `<ul class="el-roll">${list.map(s => `<li><span>${esc(s.name)} <span class="sub">${s.grade ? gradeName(s.grade).replace(" grade", "") : ""}</span></span><button class="ghost small danger" data-unseat="${esc(s.sid)}" type="button">Remove</button></li>`).join("")}</ul>` : '<p class="sub">Nobody yet.</p>'}
      </div>`;
    }).join("")}</div>`).join("") || `<p class="sub">No classes published yet.</p>`;

  // students still to choose, with a "place in" menu
  const waiting = ids.filter(id => !C[id]).sort((a, b) => R[a].grade - R[b].grade || R[a].name.localeCompare(R[b].name));
  $("#pending").innerHTML = waiting.length ? `<table class="board"><tbody>${waiting.map(id => {
    const band = bandOf(R[id].grade);
    const opts = classList().map(c => { const pe = poolFor(c, band); if (!pe) return ""; const fr = freeSeats(c.id, pe[0]).length; return `<option value="${c.id}|${pe[0]}" ${fr ? "" : "disabled"}>${esc(c.name)}${fr ? ` (${fr} free)` : " (full)"}</option>`; }).join("");
    return `<tr><td class="nm">${esc(R[id].name)}</td><td>${gradeName(R[id].grade).replace(" grade", "")}</td><td class="r"><select class="text" style="font-size:14px;padding:5px 8px;max-width:230px" data-assign="${esc(id)}"><option value="">Place in…</option>${opts}</select></td></tr>`;
  }).join("")}</tbody></table>` : `<p class="sub">${ids.length ? "Everyone has a class." : "Add your students first."}</p>`;

  // roster summary
  const byGrade = GRADES.map(g => [g, ids.filter(id => Number(R[id].grade) === g)]);
  $("#rosterTbl").innerHTML = ids.length ? `<table class="board"><thead><tr><th>Grade</th><th class="r">Students</th><th class="r">Signed up</th><th></th></tr></thead><tbody>${
    byGrade.map(([g, l]) => `<tr><td>${gradeName(g)}</td><td class="r">${l.length}</td><td class="r">${l.filter(id => C[id]).length}</td><td class="r">${l.length ? `<details><summary class="sub" style="cursor:pointer">names</summary>${l.sort((a, b) => R[a].name.localeCompare(R[b].name)).map(id => `<div class="row" style="justify-content:space-between;gap:6px;padding:3px 0"><span>${esc(R[id].name)}</span><button class="ghost small danger" data-delstudent="${esc(id)}" type="button">Delete</button></div>`).join("")}</details>` : ""}</td></tr>`).join("")
  }</tbody></table>` : "";
}

/* ---------- actions ---------- */
function armed(btn, label) {
  if (btn.dataset.arm) return true;
  btn.dataset.arm = "1"; const old = btn.textContent; btn.textContent = label;
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.arm; btn.textContent = old; } }, 3000);
  return false;
}
$("#publishBtn").addEventListener("click", async () => {
  const upd = {};
  CLASSES.forEach((c, i) => {
    const pools = {};
    for (const [pool, p] of Object.entries(c.pools)) {
      const have = Object.keys(seatsOf(c.id, pool)).length;
      pools[pool] = { cap: Math.max(p.cap, have), bands: Object.fromEntries(p.bands.map(b => [b, true])) };
      for (let n = have + 1; n <= p.cap; n++) upd[`seats/${c.id}/${pool}/${seatKey(n)}/open`] = true;
    }
    upd[`classes/${c.id}`] = { name: c.name, who: c.who, order: i, pools };
  });
  if (!data.config) upd.config = { open: false, label: TERM_LABEL };
  try { await update(r(base), upd); $("#publishNote").textContent = "Classes and seats are up to date."; }
  catch (e) { $("#publishNote").textContent = "Couldn't publish. Check the database rules."; }
});
$("#toggleOpen").addEventListener("click", () => update(r(base + "/config"), { open: !(data.config && data.config.open) }));
$("#copyUrl").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#studentUrl").textContent); $("#copyUrl").textContent = "Copied"; }
  catch (e) { const rg = document.createRange(); rg.selectNodeContents($("#studentUrl")); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); }
});
$("#classAdmin").addEventListener("click", async e => {
  const sb = e.target.closest("[data-seat]");
  if (sb) {
    const { cls, pool } = sb.dataset, have = Object.keys(seatsOf(cls, pool)).sort();
    if (sb.dataset.seat === "+") await update(r(base), { [`seats/${cls}/${pool}/${seatKey(have.length + 1)}/open`]: true, [`classes/${cls}/pools/${pool}/cap`]: have.length + 1 });
    else {
      const fr = freeSeats(cls, pool); if (!fr.length) return;
      await update(r(base), { [`seats/${cls}/${pool}/${fr[fr.length - 1]}`]: null, [`classes/${cls}/pools/${pool}/cap`]: have.length - 1 });
    }
    return;
  }
  const ub = e.target.closest("[data-unseat]");
  if (ub && armed(ub, "Tap again")) {
    const sid = ub.dataset.unseat, c = choices()[sid];
    await update(r(base), { [`choices/${sid}`]: null, [`seats/${c.cls}/${c.pool}/${c.seat}/sid`]: null });
  }
});
$("#pending").addEventListener("change", async e => {
  const s = e.target.closest("[data-assign]"); if (!s || !s.value) return;
  const sid = s.dataset.assign, [cls, pool] = s.value.split("|"), fr = freeSeats(cls, pool);
  if (!fr.length) return;
  s.disabled = true;
  for (const seat of fr) {
    try {
      await update(r(base), { [`seats/${cls}/${pool}/${seat}/sid`]: sid, [`choices/${sid}`]: { cls, pool, seat, uid: user.uid, at: serverTimestamp() } });
      return;
    } catch (err) { /* seat taken a moment ago: try the next one */ }
  }
  s.disabled = false; s.value = "";
});
$("#addRoster").addEventListener("click", async () => {
  const lines = $("#rosterIn").value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const have = new Set(Object.values(roster()).map(p => normKey(p.name) + "|" + p.grade));
  const upd = {}, bad = [];
  let added = 0, dup = 0;
  for (const line of lines) {
    const parts = line.split(/\t|;|,/).map(x => x.trim()).filter(Boolean);
    const gi = parts.findIndex(p => /^(\d{1,2})(st|nd|rd|th)?$/i.test(p));
    const grade = gi >= 0 ? parseInt(parts[gi], 10) : NaN;
    const name = parts.filter((_, i) => i !== gi).join(" ").replace(/\s+/g, " ").trim();
    if (!name || !GRADES.includes(grade)) { bad.push(line); continue; }
    const k = normKey(name) + "|" + grade;
    if (have.has(k)) { dup++; continue; }
    have.add(k);
    upd[`roster/${push(r(base + "/roster")).key}`] = { name: name.slice(0, 40), grade, band: bandOf(grade) };
    added++;
  }
  if (added) await update(r(base), upd);
  $("#rosterNote").textContent = `${added} added${dup ? `, ${dup} already on the list` : ""}${bad.length ? `, ${bad.length} lines skipped (need a name and a grade from 4 to 11)` : ""}.`;
  if (!bad.length) $("#rosterIn").value = ""; else $("#rosterIn").value = bad.join("\n");
});
$("#rosterTbl").addEventListener("click", async e => {
  const b = e.target.closest("[data-delstudent]"); if (!b || !armed(b, "Tap again")) return;
  const sid = b.dataset.delstudent, c = choices()[sid], upd = { [`roster/${sid}`]: null };
  if (c) { upd[`choices/${sid}`] = null; upd[`seats/${c.cls}/${c.pool}/${c.seat}/sid`] = null; }
  await update(r(base), upd);
});
$("#csvBtn").addEventListener("click", () => {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const R = roster(), C = choices(), cls = data.classes || {};
  const rows = [["student", "grade", "elective"]];
  Object.entries(R).sort((a, b) => a[1].grade - b[1].grade || a[1].name.localeCompare(b[1].name))
    .forEach(([id, p]) => rows.push([p.name, p.grade, C[id] ? (cls[C[id].cls] || {}).name || C[id].cls : "not chosen"]));
  const blob = new Blob(["﻿" + rows.map(x => x.map(q).join(",")).join("\r\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `electives-${TERM}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
