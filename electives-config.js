// Electives for this quarter. To set up a new quarter, change TERM (a new id keeps
// the old quarter's sign-ups separate), the labels and the classes, then open
// electives-admin.html and press "Publish classes and seats".
//
// Grade bands: "ms" = 4th to 6th grade, "hs" = 7th to 11th grade.
// Each class has one or more seat pools. A pool has a capacity and the bands that may use it.

export const TERM = "2026-q2";
export const TERM_LABEL = "2nd Quarter";

export const CLASSES = [
  {
    id: "robotics", name: "Robotics & Engineering Lab", who: "High school (7th–11th)",
    pools: { all: { cap: 16, bands: ["hs"] } }
  },
  {
    id: "art", name: "Art & Illustration", who: "Middle and high school (4th–11th)",
    pools: { all: { cap: 16, bands: ["ms", "hs"] } }
  },
  {
    id: "speaking", name: "Public Speaking & Leadership", who: "Middle and high school (4th–11th)",
    pools: { all: { cap: 16, bands: ["ms", "hs"] } }
  },
  {
    id: "chess", name: "Chess Masters", who: "8 seats for 4th–6th, 8 seats for 7th–11th",
    pools: { ms: { cap: 8, bands: ["ms"] }, hs: { cap: 8, bands: ["hs"] } }
  },
  {
    id: "fashion", name: "Fashion Design", who: "Middle school (4th–6th)",
    pools: { all: { cap: 16, bands: ["ms"] } }
  }
];

export const GRADES = [4, 5, 6, 7, 8, 9, 10, 11];
export const bandOf = grade => (Number(grade) <= 6 ? "ms" : "hs");
export const gradeName = g => `${g}${{ 1: "st", 2: "nd", 3: "rd" }[g] || "th"} grade`;
export const BAND_NAME = { ms: "4th–6th", hs: "7th–11th" };
