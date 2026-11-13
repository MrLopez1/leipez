// Judges' page: sign in with name + PIN, pick a project, score it. Drafts save as you go.
import {
  configured, auth, r, onAuthStateChanged, signInAnonymously,
  onValue, get, set, remove, serverTimestamp
} from "./fb.js";
import { $, esc, showOnly } from "./ui.js";
import {
  FAIR_NAME, RUBRICS, CATS, STEAM_TYPES, items, rubricOf, rubricTotal, rubricComplete, divKey, divLabel, memberList
} from "./fair-config.js";
import { base, withTimeout, projectList, divisions, publish } from "./fair-core.js";

const VIEWS = ["j-setup", "j-loading", "j-msg", "j-login", "j-list", "j-score"];
const ready = () => { window.__elReady = true; };
const view = id => { ready(); showOnly(VIEWS, id); };
let uid = null, jid = null, D = { config: null, judges: {}, projects: {}, scores: {}, pub: null };
let subs = [], scoreSub = null, picked = null, cur = null, saveTimer = null, saving = 0, lastErr = "";
$("#fairName").textContent = FAIR_NAME;

const message = (title, text) => { $("#msgTitle").textContent = title; $("#msgText").innerHTML = text; view("j-msg"); };
const isOpen = () => !!(D.config && D.config.open);
const myScore = pid => ((D.scores || {})[pid] || {})[jid] || null;
const statusOf = p => { const s = myScore(p.id); return !s || s.rubric !== rubricOf(p) ? "none" : s.status; };

if (!configured) { ready(); showOnly(VIEWS, "j-setup"); }
else onAuthStateChanged(auth, async u => {
  if (!u) { signInAnonymously(auth).catch(() => message("Can't connect", "Anonymous sign-in must be turned on in Firebase → Authentication → Sign-in method.")); return; }
  if (uid === u.uid) return;
  uid = u.uid;
  subs.forEach(f => f()); subs = [];
  try { await withTimeout(get(r(base + "/config")), 15000); }
  catch (e) { message("Can't reach the database", e && e.message === "timeout" ? "The database isn't answering. Check the internet connection and <b>databaseURL</b> in js/config.js." : "The database rules don't allow this page yet. Publish the latest <b>database.rules.json</b> in Firebase."); return; }
  subs.push(onValue(r(base + "/config"), s => { D.config = s.val(); refresh(); }));
  subs.push(onValue(r(base + "/judges"), s => { D.judges = s.val() || {}; refresh(); }));
  subs.push(onValue(r(base + "/projects"), s => { D.projects = s.val() || {}; refresh(); schedulePublish(); }));
  subs.push(onValue(r(base + "/public"), s => { D.pub = s.val(); schedulePublish(); }));
  const sess = (await get(r(base + "/sessions/" + uid)).catch(() => null));
  const sj = sess && sess.val() && sess.val().jid;
  if (sj) enter(sj); else showLogin();
});

/* ---------- sign in ---------- */
function showLogin(note) {
  jid = null; if (scoreSub) { scoreSub(); scoreSub = null; }
  $("#judgeName").textContent = ""; $("#signOutBtn").hidden = true;
  if (!D.config && !Object.keys(D.judges).length) { message("The fair isn't set up yet", "The fair coordinator needs to add the judges on the teacher page first."); return; }
  renderJudges();
  $("#pinErr").textContent = note || "";
  view("j-login");
}
function renderJudges() {
  const list = Object.entries(D.judges).map(([id, j]) => ({ id, ...j })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  $("#judgeList").innerHTML = list.length ? list.map(j => `<button type="button" class="sf-name" data-j="${esc(j.id)}" aria-pressed="${j.id === picked}">${esc(j.name)}</button>`).join("")
    : `<p class="sub">No judges have been added yet.</p>`;
  $("#pinForm").hidden = !picked || !D.judges[picked];
  if (picked && D.judges[picked]) $("#pinWho").textContent = D.judges[picked].name;
}
$("#judgeList").addEventListener("click", e => {
  const b = e.target.closest("[data-j]"); if (!b) return;
  picked = b.dataset.j; $("#pinErr").textContent = ""; renderJudges(); $("#pinIn").value = ""; $("#pinIn").focus();
});
$("#pinForm").addEventListener("submit", async e => {
  e.preventDefault();
  const pin = $("#pinIn").value.trim();
  if (!pin) { $("#pinErr").textContent = "Type your PIN."; return; }
  $("#pinBtn").disabled = true; $("#pinErr").textContent = "";
  try { await withTimeout(set(r(base + "/sessions/" + uid), { jid: picked, pin }), 15000); enter(picked); }
  catch (err) { $("#pinErr").textContent = err && err.message === "timeout" ? "No answer from the database. Check the connection." : "That PIN doesn't match. Check it with the fair coordinator."; }
  finally { $("#pinBtn").disabled = false; }
});
$("#signOutBtn").addEventListener("click", async () => {
  await flush();
  await remove(r(base + "/sessions/" + uid)).catch(() => {});
  picked = null; showLogin();
});

function enter(id) {
  jid = id; picked = id;
  if (scoreSub) scoreSub();
  scoreSub = onValue(r(base + "/scores"), s => { D.scores = s.val() || {}; if (!$("#j-score").hidden) renderBar(); else renderList(); schedulePublish(); },
    () => { scoreSub = null; showLogin("You've been signed out: your PIN was changed or you were removed as a judge."); });
  $("#signOutBtn").hidden = false;
  renderList(); view("j-list");
}

function refresh() {
  if (!jid) { if (!$("#j-login").hidden || !$("#j-msg").hidden) showLogin($("#pinErr").textContent); return; }
  if (!D.judges[jid] && Object.keys(D.judges).length) { showLogin("You were removed as a judge."); return; }
  $("#judgeName").textContent = (D.judges[jid] || {}).name || "";
  if (!$("#j-score").hidden) { if (cur && !D.projects[cur.pid]) { flash("That project was removed."); openList(); return; } renderHead(); lockForm(); renderBar(); }
  else renderList();
}

/* ---------- keep the results page up to date ---------- */
let pubTimer = null;
function schedulePublish() {
  if (!jid) return;
  clearTimeout(pubTimer);
  pubTimer = setTimeout(() => publish(D.projects, D.scores, D.pub).catch(() => {}), 700 + Math.random() * 600);
}

/* ---------- project list ---------- */
const STATUS = { none: ["Not started", ""], draft: ["Draft saved", "draft"], final: ["Submitted", "done"] };
function renderList() {
  if (!jid) return;
  const q = $("#filter").value.trim().toLowerCase();
  const divs = divisions(D.projects);
  const all = divs.flatMap(d => d.projects);
  const done = all.filter(p => statusOf(p) === "final").length;
  $("#listSub").textContent = all.length ? `You've submitted ${done} of ${all.length} projects.` : "";
  $("#closedNote").hidden = isOpen();
  const html = divs.map(d => {
    const list = d.projects.filter(p => !q || `${p.num} ${p.title} ${p.members}`.toLowerCase().includes(q));
    if (!list.length) return "";
    return `<div><h3 style="margin-bottom:8px">${esc(divLabel(d.key))}</h3><div class="sf-cards">${list.map(p => {
      const st = statusOf(p), s = myScore(p.id), [lab, cls] = STATUS[st];
      return `<button type="button" class="sf-card ${cls}" data-p="${esc(p.id)}">
        <span class="sf-num">${esc(p.num ?? "")}</span>
        <span class="sf-card-body"><b>${esc(p.title || "(no name yet)")}</b><small>${esc(memberList(p).join(", "))}</small>
        <small>${esc(p.cat === "STEAM" ? "STEAM · " + STEAM_TYPES[p.stype === "rob" ? "rob" : "inv"] : CATS[p.cat].name)}</small></span>
        <span class="sf-status">${lab}${st !== "none" ? `<br><b class="num">${esc(s.total)}</b>` : ""}</span></button>`;
    }).join("")}</div></div>`;
  }).join("");
  $("#projList").innerHTML = html || `<p class="empty">${all.length ? "No project matches that search." : "There are no projects to judge yet."}</p>`;
}
$("#filter").addEventListener("input", renderList);
$("#projList").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b) openProject(b.dataset.p); });
function flash(t) { const f = $("#flash"); f.textContent = t; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => { f.hidden = true; }, 5000); }

/* ---------- scoring ---------- */
function openProject(pid) {
  const p = D.projects[pid]; if (!p) return;
  const rub = rubricOf({ ...p }); if (!rub) return;
  const s = myScore(pid);
  const same = s && s.rubric === rub;
  cur = { pid, rub, crit: same ? { ...(s.crit || {}) } : {}, c1: same ? s.c1 || "" : "", c2: same ? s.c2 || "" : "", sugg: same ? s.sugg || "" : "", status: same ? s.status : "draft", dirty: false, moved: !!(s && !same) };
  renderHead(); renderForm(); lockForm(); renderBar();
  view("j-score");
}
function renderHead() {
  const p = D.projects[cur.pid]; if (!p) return;
  const rub = rubricOf(p);
  if (rub !== cur.rub) { openProject(cur.pid); return; }
  $("#sDiv").textContent = divLabel(divKey(p));
  $("#sTitle").textContent = `${p.num ?? ""}. ${p.title || "(no name yet)"}`;
  $("#sMembers").textContent = memberList(p).join(", ");
  $("#sRubric").textContent = RUBRICS[rub].name;
}
function renderForm() {
  const R = RUBRICS[cur.rub];
  $("#sCrit").innerHTML = R.groups.map(g => `<div class="stack" style="gap:10px"><h3>${esc(g.name)}</h3>${g.items.map(it => {
    const v = cur.crit[it.id];
    const btns = it.values
      ? it.values.map((x, i) => `<button type="button" data-c="${it.id}" data-v="${x}" aria-pressed="${v === x}"><b>${x}</b><small>${esc(R.levelNames[i])}</small></button>`).join("")
      : Array.from({ length: it.max }, (_, i) => i + 1).map(x => `<button type="button" data-c="${it.id}" data-v="${x}" aria-pressed="${v === x}"><b>${x}</b></button>`).join("");
    return `<div class="sf-crit${v !== undefined ? " set" : ""}" id="crit-${it.id}">
      <div class="sf-crit-head"><div>${it.sub ? `<span class="label" style="margin:0">${esc(it.sub)}</span>` : ""}<b>${esc(it.title)}</b></div><span class="sf-pts"><b class="num">${v ?? "–"}</b> / ${it.values ? Math.max(...it.values) : it.max}</span></div>
      ${it.desc ? `<p class="sub" style="margin:0">${esc(it.desc)}</p>` : ""}
      <div class="sf-levels${it.values ? " named" : ""}">${btns}</div>
      ${it.bands ? `<ul class="sf-bands">${it.bands.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
    </div>`;
  }).join("")}</div>`).join("");
  $("#sComments").hidden = !R.comments.length;
  $("#sComments").innerHTML = `<h3>Comments for the students</h3>` + R.comments.map(c => `<div><label class="label" for="cm-${c.id}">${esc(c.label)}</label><textarea class="text sf-text" id="cm-${c.id}" data-cm="${c.id}" rows="2">${esc(cur[c.id] || "")}</textarea></div>`).join("");
  markBands();
}
function markBands() {
  for (const it of items(cur.rub)) {
    if (!it.bands) continue;
    const v = cur.crit[it.id], el = document.getElementById("crit-" + it.id);
    el.querySelectorAll(".sf-bands li").forEach(li => {
      const m = li.textContent.match(/^(\d+)(?:-(\d+))?:/); if (!m) return;
      const a = Number(m[1]), b = Number(m[2] || m[1]);
      li.classList.toggle("on", v !== undefined && v <= Math.max(a, b) && v >= Math.min(a, b));
    });
  }
}
function lockForm() {
  const off = !isOpen();
  document.querySelectorAll("#sCrit button, #sComments textarea").forEach(b => { b.disabled = off; });
  $("#submitBtn").hidden = off;
  const n = off ? "Judging is closed, so scores can't be changed." : cur.moved ? "This project moved to a different category since you scored it, so it uses a different rubric now. Please score it again." : "";
  $("#sNotice").textContent = n; $("#sNotice").hidden = !n;
}
$("#sCrit").addEventListener("click", e => {
  const b = e.target.closest("[data-c]"); if (!b || b.disabled) return;
  const id = b.dataset.c, v = Number(b.dataset.v);
  cur.crit[id] = v;
  const box = document.getElementById("crit-" + id);
  box.classList.add("set");
  box.querySelectorAll("[data-c]").forEach(x => x.setAttribute("aria-pressed", String(Number(x.dataset.v) === v)));
  box.querySelector(".sf-pts b").textContent = v;
  markBands(); changed();
});
$("#sComments").addEventListener("input", e => { const t = e.target.closest("[data-cm]"); if (!t) return; cur[t.dataset.cm] = t.value.slice(0, 1000); changed(); });

function changed() { cur.dirty = true; renderBar(); clearTimeout(saveTimer); saveTimer = setTimeout(save, 800); }
function renderBar() {
  if (!cur) return;
  const total = rubricTotal(cur.rub, cur.crit), left = items(cur.rub).filter(it => cur.crit[it.id] === undefined).length;
  $("#sTotal").textContent = total;
  $("#sLeft").textContent = left ? `${left} to go` : "All criteria scored";
  $("#sSave").textContent = lastErr ? lastErr : saving || cur.dirty ? "Saving…" : myScore(cur.pid) && myScore(cur.pid).rubric === cur.rub ? (cur.status === "final" ? "Submitted · changes save automatically" : "Draft saved") : "Nothing saved yet";
  $("#sSave").classList.toggle("bad", !!lastErr);
  $("#submitBtn").disabled = !!left;
  $("#submitBtn").textContent = cur.status === "final" ? "Done" : "Submit score";
}
async function save(final) {
  clearTimeout(saveTimer); saveTimer = null;
  if (!cur || !isOpen()) return false;
  const c = cur;
  if (final) c.status = "final";
  if (!final && !c.dirty) return true;
  const body = { rubric: c.rub, crit: { ...c.crit }, total: rubricTotal(c.rub, c.crit), status: c.status === "final" && rubricComplete(c.rub, c.crit) ? "final" : "draft", at: serverTimestamp() };
  for (const k of ["c1", "c2", "sugg"]) if (RUBRICS[c.rub].comments.some(x => x.id === k) && c[k].trim()) body[k] = c[k];
  c.dirty = false; saving++; lastErr = ""; renderBar();
  try { await withTimeout(set(r(`${base}/scores/${c.pid}/${jid}`), body), 20000); return true; }
  catch (e) {
    c.dirty = true;
    lastErr = e && e.message === "timeout" ? "Not saved yet: no connection. Keep this page open." : "Not saved: judging may be closed or you were signed out.";
    if (!(e && e.message === "timeout")) { saveTimer = setTimeout(save, 5000); }
    return false;
  }
  finally { saving--; renderBar(); }
}
async function flush() { if (cur && (cur.dirty || saveTimer)) await save(); }
async function openList() { await flush(); cur = null; lastErr = ""; renderList(); view("j-list"); }
$("#backBtn").addEventListener("click", openList);
$("#submitBtn").addEventListener("click", async () => {
  if (cur.status === "final" && !cur.dirty) { openList(); return; }
  $("#submitBtn").disabled = true;
  const p = D.projects[cur.pid];
  if (await save(true)) { flash(`Submitted: ${p ? p.num + ". " + (p.title || "") : ""} · ${rubricTotal(cur.rub, cur.crit)} / 100`); openList(); }
  else renderBar();
});
window.addEventListener("beforeunload", e => { if (cur && (cur.dirty || saving)) { e.preventDefault(); e.returnValue = ""; } });
