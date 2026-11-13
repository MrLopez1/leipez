// Teacher page for the fair: projects, judges and PINs, open/close judging, every score.
import {
  configured, auth, r, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  onValue, get, set, update, push
} from "./fb.js";
import { $, esc, showOnly, ordinal } from "./ui.js";
import {
  FAIR, FAIR_NAME, RUBRICS, CATS, STEAM_TYPES, items, rubricOf, levelsFor, levelName, divKey, divLabel, memberList, warnings
} from "./fair-config.js";
import { base, withTimeout, projectList, summarize, divisions, publish } from "./fair-core.js";
import { SEED } from "./fair-seed.js";

const VIEWS = ["a-setup", "a-loading", "a-signin", "a-denied", "a-main"];
const ready = () => { window.__elReady = true; };
let D = {}, unsub = null;
const openRows = new Set();
$("#fairName").textContent = `${FAIR_NAME} · fair id ${FAIR}`;
const judgeUrl = new URL("fair-judge.html", location.href).href, resultsUrl = new URL("fair-results.html", location.href).href;
$("#judgeUrl").textContent = judgeUrl; $("#resultsUrl").textContent = resultsUrl; $("#resultsOpen").href = resultsUrl;

if (!configured) { ready(); showOnly(VIEWS, "a-setup"); }
else onAuthStateChanged(auth, async u => {
  if (unsub) { unsub(); unsub = null; }
  if (!u || u.isAnonymous) { $("#whoEmail").textContent = ""; $("#signOutBtn").hidden = true; ready(); showOnly(VIEWS, "a-signin"); return; }
  $("#whoEmail").textContent = u.email || ""; $("#signOutBtn").hidden = false;
  try { await withTimeout(get(r("history")), 15000); }
  catch (e) {
    if (e && e.message === "timeout") { showOnly(VIEWS, "a-loading"); window.__elShow && window.__elShow("Signed in, but the database isn't answering. Check <b>databaseURL</b> in js/config.js: it must match the link at the top of Firebase → Realtime Database → Data."); return; }
    ready(); $("#deniedEmail").textContent = u.email || ""; showOnly(VIEWS, "a-denied"); return;
  }
  ready(); showOnly(VIEWS, "a-main");
  unsub = onValue(r(base), s => { D = s.val() || {}; render(); schedulePublish(); },
    () => { window.__elShow && window.__elShow("The database rules don't let this account read the fair. Publish the latest <b>database.rules.json</b> in Firebase."); showOnly(VIEWS, "a-loading"); });
});
$("#googleBtn").addEventListener("click", async () => {
  $("#signinErr").textContent = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { $("#signinErr").textContent = e && e.code === "auth/unauthorized-domain" ? "Add this site's domain in Firebase → Authentication → Settings → Authorized domains." : "Sign-in didn't finish. Try again."; }
});
$("#signOutBtn").addEventListener("click", () => signOut(auth));

let pubTimer = null;
function schedulePublish() { clearTimeout(pubTimer); pubTimer = setTimeout(() => publish(D.projects, D.scores, D.public).catch(() => {}), 500); }
const note = (t, bad) => { const n = $("#topNote"); n.textContent = t; n.style.color = bad ? "var(--bad)" : ""; clearTimeout(note.t); note.t = setTimeout(() => { n.textContent = ""; }, 6000); };
const fail = e => note("Couldn't save: " + (e && e.message || e), true);

/* ---------- render ---------- */
function render() {
  const open = !!(D.config && D.config.open);
  $("#openState").textContent = open ? "Open: judges can score" : "Closed";
  $("#toggleOpen").textContent = open ? "Close judging" : "Open judging";
  const P = D.projects || {}, S = D.scores || {}, sum = summarize(P, S);
  const judgedList = divisions(P).flatMap(d => d.projects);
  const fin = Object.values(sum.progress).reduce((a, x) => a + x.final, 0), dr = Object.values(sum.progress).reduce((a, x) => a + x.draft, 0);
  $("#stats").innerHTML = [["Projects to judge", judgedList.length], ["Judges", Object.keys(D.judges || {}).length], ["Projects with a score", Object.keys(sum.avg).length], ["Scores submitted", fin], ["Drafts", dr]]
    .map(([k, v]) => `<div class="statchip"><b>${v}</b><span>${k}</span></div>`).join("");
  renderJudges(); renderProjects(); renderScores(sum);
}

/* ---------- judges ---------- */
const newPin = () => {
  const used = new Set(Object.values((D.private || {}).pins || {}));
  let p; do { p = String(Math.floor(1000 + Math.random() * 9000)); } while (used.has(p));
  return p;
};
function renderJudges() {
  const pins = (D.private || {}).pins || {}, S = D.scores || {};
  const list = Object.entries(D.judges || {}).map(([id, j]) => ({ id, ...j })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const count = id => Object.values(S).reduce((a, byJ) => { const s = byJ[id]; if (s) a[s.status === "final" ? 0 : 1]++; return a; }, [0, 0]);
  $("#judgeTbl").innerHTML = list.length ? `<table class="board"><thead><tr><th>Judge</th><th>PIN</th><th class="r">Submitted</th><th></th></tr></thead><tbody>${list.map(j => {
    const [f, d] = count(j.id);
    return `<tr><td class="nm">${esc(j.name)}</td><td><span class="num sf-pin">${esc(pins[j.id] || "—")}</span></td><td class="r">${f}${d ? ` <span class="sub">(+${d} draft)</span>` : ""}</td>
      <td class="r" style="white-space:nowrap"><button class="ghost small" data-pin="${esc(j.id)}" type="button">New PIN</button> <button class="ghost small danger" data-deljudge="${esc(j.id)}" type="button">Remove</button></td></tr>`;
  }).join("")}</tbody></table>` : `<p class="empty">No judges yet. Add each judge's name above.</p>`;
}
$("#judgeForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#judgeIn").value.trim().slice(0, 40); if (!name) return;
  if (Object.values(D.judges || {}).some(j => String(j.name).toLowerCase() === name.toLowerCase())) { note("There's already a judge with that name.", true); return; }
  const id = push(r(base + "/judges")).key;
  update(r(base), { [`judges/${id}`]: { name }, [`private/pins/${id}`]: newPin() }).then(() => { $("#judgeIn").value = ""; }, fail);
});
$("#judgeTbl").addEventListener("click", e => {
  const pb = e.target.closest("[data-pin]"), db = e.target.closest("[data-deljudge]");
  if (pb) { set(r(`${base}/private/pins/${pb.dataset.pin}`), newPin()).then(() => note(`New PIN for ${D.judges[pb.dataset.pin].name}. They need to sign in again with it.`), fail); }
  if (db) {
    const id = db.dataset.deljudge, j = D.judges[id];
    const n = Object.values(D.scores || {}).filter(byJ => byJ[id]).length;
    if (!confirm(`Remove ${j.name} as a judge?${n ? ` Their ${n} ${n === 1 ? "score" : "scores"} will be deleted too.` : ""}`)) return;
    const u = { [`judges/${id}`]: null, [`private/pins/${id}`]: null };
    for (const pid of Object.keys(D.scores || {})) if (D.scores[pid][id]) u[`scores/${pid}/${id}`] = null;
    update(r(base), u).catch(fail);
  }
});

/* ---------- projects ---------- */
let projPending = false;
function renderProjects() {
  const tbl = $("#projTbl");
  if (tbl.contains(document.activeElement) && document.activeElement.matches("input")) { projPending = true; return; }
  projPending = false;
  const list = projectList(D.projects);
  $("#seedBox").hidden = list.length > 0;
  const opt = (v, label, curV) => `<option value="${esc(v)}"${String(curV ?? "") === String(v) ? " selected" : ""}>${esc(label)}</option>`;
  const nWarn = list.filter(p => warnings(p).length).length;
  $("#projWarn").innerHTML = nWarn ? `<div class="note bad">${nWarn} ${nWarn === 1 ? "project needs" : "projects need"} attention (marked in red below). The results page shows projects without a division under “division not set yet”.</div>` : "";
  tbl.innerHTML = list.length ? `<table class="board sf-ptbl"><thead><tr><th>#</th><th>Project</th><th>Students <span class="sub" style="text-transform:none;letter-spacing:0">(commas between names)</span></th><th>Category</th><th>Division</th><th></th></tr></thead><tbody>${list.map(p => {
    const w = warnings(p), lv = levelsFor(p.cat);
    return `<tr data-p="${esc(p.id)}" class="${w.length ? "warn" : ""}">
      <td><input class="text sf-in num" data-f="num" value="${esc(p.num ?? "")}" inputmode="numeric" style="width:58px"></td>
      <td><input class="text sf-in" data-f="title" value="${esc(p.title || "")}" placeholder="Project name">${p.field ? `<small class="sub">From the list: ${esc(p.field)}</small>` : ""}</td>
      <td><input class="text sf-in" data-f="members" value="${esc(p.members || "")}" placeholder="Name, Name"><small class="sub">${memberList(p).length} ${memberList(p).length === 1 ? "student" : "students"}</small></td>
      <td><select class="text sf-in" data-f="cat">${opt("", "Choose…", p.cat)}${Object.entries(CATS).map(([k, c]) => opt(k, c.short === "Not judged" ? "Not judged" : c.name, p.cat)).join("")}</select>
        ${p.cat === "STEAM" ? `<select class="text sf-in" data-f="stype" style="margin-top:6px">${Object.entries(STEAM_TYPES).map(([k, t]) => opt(k, t, p.stype || "inv")).join("")}</select>` : ""}</td>
      <td>${lv.length ? `<select class="text sf-in" data-f="level">${opt("", "Choose…", p.level)}${lv.map(l => opt(l, levelName(l), p.level)).join("")}</select>` : `<span class="sub">—</span>`}</td>
      <td class="r"><button class="ghost small danger" data-delp type="button" title="Delete project">Delete</button></td>
    </tr>${w.length ? `<tr class="warnrow" data-p="${esc(p.id)}"><td></td><td colspan="5">${w.map(x => `<span class="sf-warn">${esc(x)}</span>`).join(" ")}${p.note ? ` <button class="ghost small" data-clearnote type="button">Note checked, hide it</button>` : ""}</td></tr>` : ""}`;
  }).join("")}</tbody></table>` : "";
}
$("#projTbl").addEventListener("focusout", () => setTimeout(() => { if (projPending && !$("#projTbl").contains(document.activeElement)) renderProjects(); }, 0));
$("#projTbl").addEventListener("change", e => {
  const el = e.target.closest("[data-f]"); if (!el) return;
  const pid = el.closest("[data-p]").dataset.p, p = (D.projects || {})[pid]; if (!p) return;
  const f = el.dataset.f; let v = el.value.trim();
  const u = {};
  if (f === "num") { v = v === "" ? "" : Number(v); if (v !== "" && !Number.isFinite(v)) return; u.num = v; }
  else if (f === "cat") { u.cat = v; u.stype = v === "STEAM" ? (p.stype || "inv") : ""; if (!levelsFor(v).includes(p.level)) u.level = ""; }
  else u[f] = v.slice(0, f === "members" ? 400 : 120);
  if (f === "cat" && rubricOf({ ...p }) !== rubricOf({ ...p, ...u })) {
    const n = Object.keys((D.scores || {})[pid] || {}).length;
    if (n && !confirm(`This project already has ${n} ${n === 1 ? "score" : "scores"} on the ${RUBRICS[rubricOf(p)].name}. With the new category it uses a different rubric, so those scores won't count and the judges will need to score it again. Change it?`)) { renderProjects(); return; }
  }
  if (f === "stype" && rubricOf({ ...p }) !== rubricOf({ ...p, ...u })) {
    const n = Object.keys((D.scores || {})[pid] || {}).length;
    if (n && !confirm(`This changes the rubric, so its ${n} ${n === 1 ? "score" : "scores"} won't count and the judges will need to score it again. Change it?`)) { renderProjects(); return; }
  }
  update(r(`${base}/projects/${pid}`), u).catch(fail);
});
$("#projTbl").addEventListener("click", e => {
  const row = e.target.closest("[data-p]"); if (!row) return;
  const pid = row.dataset.p, p = (D.projects || {})[pid];
  if (e.target.closest("[data-clearnote]")) { update(r(`${base}/projects/${pid}`), { note: "" }).catch(fail); return; }
  if (e.target.closest("[data-delp]")) {
    const n = Object.keys((D.scores || {})[pid] || {}).length;
    if (!confirm(`Delete project ${p.num ?? ""} “${p.title || ""}”?${n ? ` Its ${n} ${n === 1 ? "score" : "scores"} will be deleted too.` : ""}`)) return;
    update(r(base), { [`projects/${pid}`]: null, [`scores/${pid}`]: null }).catch(fail);
  }
});
$("#addProj").addEventListener("click", () => {
  const nums = projectList(D.projects).map(p => Number(p.num) || 0);
  const ref = push(r(base + "/projects"));
  set(ref, { num: (nums.length ? Math.max(...nums) : 0) + 1, title: "", members: "", field: "", cat: "A", stype: "", level: "", note: "" })
    .then(() => { setTimeout(() => { const i = document.querySelector(`[data-p="${ref.key}"] [data-f="title"]`); if (i) { i.focus(); i.scrollIntoView({ block: "center" }); } }, 150); }, fail);
});
$("#seedBtn").addEventListener("click", () => { if (projectList(D.projects).length) return; set(r(base + "/projects"), SEED).catch(fail); });

/* ---------- opening / closing ---------- */
$("#toggleOpen").addEventListener("click", () => {
  const open = !(D.config && D.config.open);
  update(r(base + "/config"), { name: FAIR_NAME, open }).catch(fail);
});
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copy]"); if (!b) return;
  const t = document.getElementById(b.dataset.copy).textContent;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500); }, () => {});
});

/* ---------- scores ---------- */
const judgeName = id => ((D.judges || {})[id] || {}).name || "(removed judge)";
function renderScores(sum) {
  const S = D.scores || {};
  const html = divisions(D.projects).map(d => {
    const rows = [...d.projects].sort((a, b) => (sum.places[a.id] || 999) - (sum.places[b.id] || 999) || (Number(a.num) || 0) - (Number(b.num) || 0));
    return `<div><h3 style="margin-bottom:6px">${esc(divLabel(d.key))}</h3><div class="sf-srows">${rows.map(p => {
      const rub = rubricOf(p), pr = sum.progress[p.id] || { final: 0, draft: 0 }, pl = sum.places[p.id];
      const list = Object.entries(S[p.id] || {}).map(([jid, s]) => ({ jid, ...s })).sort((a, b) => judgeName(a.jid).localeCompare(judgeName(b.jid)));
      return `<details class="sf-srow" data-p="${esc(p.id)}"${openRows.has(p.id) ? " open" : ""}><summary>
        <span class="rank${pl && pl <= 3 ? " gold" : ""}">${pl ? ordinal(pl) : "–"}</span>
        <span class="sf-who"><b>${esc(p.num ?? "")}. ${esc(p.title || "(no name)")}</b><small>${esc(memberList(p).join(", "))}${p.cat === "STEAM" ? " · " + esc(STEAM_TYPES[p.stype === "rob" ? "rob" : "inv"]) : ""}</small></span>
        <span class="sub" style="white-space:nowrap">${pr.final} submitted${pr.draft ? `, ${pr.draft} draft` : ""}</span>
        <span class="num sf-avg">${sum.avg[p.id] !== undefined ? sum.avg[p.id].toFixed(1) : "—"}</span></summary>
        ${list.length ? `<div class="sf-judgings">${list.map(s => {
          const old = s.rubric !== rub;
          const crit = items(s.rubric in RUBRICS ? s.rubric : rub).map(it => `${esc(it.title)} <b>${(s.crit || {})[it.id] ?? "–"}</b>`).join(" · ");
          return `<div class="sf-judging${old ? " old" : ""}"><div class="row" style="justify-content:space-between;gap:8px;align-items:center">
            <b>${esc(judgeName(s.jid))}: <span class="num">${esc(s.total)}</span> / 100</b>
            <span>${s.status === "final" ? `<span class="pill good">Submitted</span>` : `<span class="pill">Draft</span>`}${old ? ` <span class="pill bad">Old rubric, not counted</span>` : ""}
            <button class="ghost small danger" data-delscore="${esc(s.jid)}" type="button">Delete</button></span></div>
            <p class="sub" style="margin:6px 0 0">${crit}</p>
            ${[["c1", "Positive"], ["c2", "Positive"], ["sugg", "Suggestion"]].filter(([k]) => s[k]).map(([k, l]) => `<p style="margin:6px 0 0"><span class="tag">${l}</span> ${esc(s[k])}</p>`).join("")}
          </div>`;
        }).join("")}</div>` : `<p class="empty">No scores yet.</p>`}
      </details>`;
    }).join("")}</div></div>`;
  }).join("");
  $("#scoreDivs").innerHTML = html || `<p class="empty">Add projects to see them here.</p>`;
}
$("#scoreDivs").addEventListener("toggle", e => { const d = e.target.closest("details[data-p]"); if (d) d.open ? openRows.add(d.dataset.p) : openRows.delete(d.dataset.p); }, true);
$("#scoreDivs").addEventListener("click", e => {
  const b = e.target.closest("[data-delscore]"); if (!b) return;
  const pid = b.closest("[data-p]").dataset.p, jid = b.dataset.delscore;
  if (!confirm(`Delete ${judgeName(jid)}'s score for project ${(D.projects[pid] || {}).num ?? ""}?`)) return;
  update(r(base), { [`scores/${pid}/${jid}`]: null }).catch(fail);
});

/* ---------- CSV ---------- */
$("#csvBtn").addEventListener("click", () => {
  const P = D.projects || {}, S = D.scores || {}, sum = summarize(P, S);
  const crits = [];
  for (const k of Object.keys(RUBRICS)) for (const it of items(k)) if (!crits.includes(it.title)) crits.push(it.title);
  const head = ["Project #", "Project", "Students", "Category", "STEAM type", "Division", "Place", "Average", "Judge", "Status", "Counted", "Total", ...crits, "Positive comment 1", "Positive comment 2", "Suggestion"];
  const rows = [head];
  for (const p of projectList(P)) {
    const rub = rubricOf(p), base0 = [p.num ?? "", p.title || "", memberList(p).join(", "), (CATS[p.cat] || {}).name || "", p.cat === "STEAM" ? STEAM_TYPES[p.stype === "rob" ? "rob" : "inv"] : "", divKey(p) ? divLabel(divKey(p)) : "", sum.places[p.id] || "", sum.avg[p.id] ?? ""];
    const list = Object.entries(S[p.id] || {});
    if (!list.length) { rows.push([...base0, "", "", "", "", ...crits.map(() => ""), "", "", ""]); continue; }
    for (const [jid, s] of list) {
      const byTitle = {}; if (RUBRICS[s.rubric]) for (const it of items(s.rubric)) byTitle[it.title] = (s.crit || {})[it.id] ?? "";
      rows.push([...base0, judgeName(jid), s.status === "final" ? "Submitted" : "Draft", s.rubric === rub && s.status === "final" ? "Yes" : "No", s.total, ...crits.map(t => byTitle[t] ?? ""), s.c1 || "", s.c2 || "", s.sugg || ""]);
    }
  }
  const csv = "﻿" + rows.map(rw => rw.map(c => { const t = String(c ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; }).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `science-fair-${FAIR}-scores.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
