// Live results: rankings per division (places only, no points) and how far judging has got.
import { configured, auth, r, onAuthStateChanged, signInAnonymously, onValue, get } from "./fb.js";
import { $, esc, showOnly, ordinal } from "./ui.js";
import { FAIR_NAME, STEAM_TYPES, divLabel, memberList } from "./fair-config.js";
import { base, withTimeout, divisions } from "./fair-core.js";

const VIEWS = ["r-setup", "r-loading", "r-msg", "r-main"];
const ready = () => { window.__elReady = true; };
let D = { config: null, projects: {}, pub: null }, started = false;
$("#fairName").textContent = FAIR_NAME;
const message = (t, x) => { ready(); $("#msgTitle").textContent = t; $("#msgText").innerHTML = x; showOnly(VIEWS, "r-msg"); };

if (!configured) { ready(); showOnly(VIEWS, "r-setup"); }
else onAuthStateChanged(auth, async u => {
  if (!u) { signInAnonymously(auth).catch(() => message("Can't connect", "Anonymous sign-in must be turned on in Firebase → Authentication → Sign-in method.")); return; }
  if (started) return; started = true;
  try { await withTimeout(get(r(base + "/config")), 15000); }
  catch (e) { started = false; message("Can't reach the database", e && e.message === "timeout" ? "The database isn't answering. Check the internet connection." : "The database rules don't allow this page yet. Publish the latest <b>database.rules.json</b> in Firebase."); return; }
  ready(); showOnly(VIEWS, "r-main");
  onValue(r(base + "/config"), s => { D.config = s.val(); render(); });
  onValue(r(base + "/projects"), s => { D.projects = s.val() || {}; render(); });
  onValue(r(base + "/public"), s => { D.pub = s.val(); render(); });
  onValue(r(".info/connected"), s => { $("#liveDot").classList.toggle("off", s.val() === false); });
});

const typeOf = p => (p.cat === "STEAM" ? STEAM_TYPES[p.stype === "rob" ? "rob" : "inv"] : "");
function render() {
  const prog = (D.pub && D.pub.progress) || {}, places = (D.pub && D.pub.places) || {};
  const divs = divisions(D.projects), all = divs.flatMap(d => d.projects);
  const done = all.filter(p => (prog[p.id] || {}).final > 0).length;
  const busy = all.filter(p => !((prog[p.id] || {}).final > 0) && (prog[p.id] || {}).draft > 0).length;
  const scores = all.reduce((a, p) => a + ((prog[p.id] || {}).final || 0), 0);
  $("#pDone").textContent = done; $("#pAll").textContent = all.length;
  $("#pBar").style.width = all.length ? (100 * done / all.length) + "%" : "0";
  $("#pBar2").style.width = all.length ? (100 * busy / all.length) + "%" : "0";
  $("#pChips").innerHTML = [["Scores submitted", scores], ["Being judged now", busy], ["Waiting", all.length - done - busy]]
    .map(([k, v]) => `<div class="statchip"><b>${v}</b><span>${k}</span></div>`).join("");
  $("#pState").textContent = !D.config ? "The fair hasn't been set up yet." : D.config.open ? "Judging is open. Places update as judges submit their scores." : done ? "Judging is closed." : "Judging hasn't started yet.";
  $("#updated").textContent = D.pub && D.pub.at ? "Updated " + new Date(D.pub.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Live";

  $("#divs").innerHTML = divs.map(d => {
    const ranked = d.projects.filter(p => places[p.id]).sort((a, b) => places[a.id] - places[b.id] || (Number(a.num) || 0) - (Number(b.num) || 0));
    const waiting = d.projects.filter(p => !places[p.id]);
    const judgedN = d.projects.length - waiting.length;
    return `<div class="panel sf-div">
      <div class="sf-div-head"><h2>${esc(divLabel(d.key))}</h2><span class="sub">${judgedN} of ${d.projects.length} judged</span></div>
      ${ranked.length ? `<ol class="sf-rank">${ranked.map(p => {
        const pl = places[p.id], n = (prog[p.id] || {}).final || 0;
        return `<li class="${pl <= 3 ? "medal m" + pl : ""}"><span class="sf-place">${ordinal(pl)}</span>
          <span class="sf-who"><b>${esc(p.title || "Project " + (p.num ?? ""))}</b><small>${esc(memberList(p).join(", "))}</small>
          <small class="sf-meta">#${esc(p.num ?? "")}${typeOf(p) ? " · " + esc(typeOf(p)) : ""} · judged by ${n} ${n === 1 ? "judge" : "judges"}</small></span></li>`;
      }).join("")}</ol>` : `<p class="empty">No scores yet.</p>`}
      ${waiting.length ? `<div class="sf-wait"><span class="label">Not judged yet</span><ul>${waiting.map(p => {
        const busy = (prog[p.id] || {}).draft > 0;
        return `<li><span>#${esc(p.num ?? "")} ${esc(p.title || "")}</span>${busy ? `<span class="pill">Being judged</span>` : ""}</li>`;
      }).join("")}</ul></div>` : ""}
    </div>`;
  }).join("") || `<p class="empty">No projects yet.</p>`;
}
