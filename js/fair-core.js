// Shared by the three fair pages: averages, places and the public summary the results page shows.
import { r, set, serverTimestamp } from "./fb.js";
import { FAIR, rubricOf, divKey, DIV_ORDER } from "./fair-config.js";

export const base = "fair/" + FAIR;
export const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
export const projectList = P => Object.entries(P || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (Number(a.num) || 999) - (Number(b.num) || 999) || String(a.title || "").localeCompare(String(b.title || "")));

// Only finished ("final") scores count, and only if they were given with the project's current
// rubric, so moving a project to another category never mixes rubrics.
export function summarize(P, S) {
  const progress = {}, places = {}, avg = {}, totals = {};
  for (const p of projectList(P)) {
    const rub = rubricOf(p); if (!rub) continue;
    let final = 0, draft = 0, sum = 0;
    for (const s of Object.values((S || {})[p.id] || {})) {
      if (!s || s.rubric !== rub) continue;
      if (s.status === "final") { final++; sum += Number(s.total) || 0; } else draft++;
    }
    progress[p.id] = { final, draft };
    if (final) { avg[p.id] = Math.round((sum / final) * 100) / 100; totals[p.id] = final; }
  }
  const byDiv = {};
  for (const id of Object.keys(avg)) (byDiv[divKey(P[id])] ||= []).push(id);
  for (const list of Object.values(byDiv)) {
    list.sort((a, b) => avg[b] - avg[a]);
    list.forEach((id, i) => { places[id] = i && avg[id] === avg[list[i - 1]] ? places[list[i - 1]] : i + 1; });
  }
  return { progress, places, avg };
}

// Group judged projects by ranking division, in display order.
export function divisions(P) {
  const m = {};
  for (const p of projectList(P)) { const k = divKey(p); if (k) (m[k] ||= []).push(p); }
  return DIV_ORDER.filter(k => m[k]).map(k => ({ key: k, projects: m[k] }));
}

const stable = v => (v && typeof v === "object" ? "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}" : JSON.stringify(v));

// Judges' pages and the teacher page keep fair/<id>/public up to date. They only write when
// something changed, so several open pages don't fight.
export function publish(P, S, current) {
  const { progress, places } = summarize(P, S);
  const cur = { progress: (current || {}).progress || {}, places: (current || {}).places || {} };
  if (stable({ progress, places }) === stable(cur)) return Promise.resolve(false);
  return set(r(base + "/public"), { progress, places, at: serverTimestamp() }).then(() => true);
}
