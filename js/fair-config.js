// Science & STEAM Fair: rubrics, categories and divisions.
// The rubrics are copied from the ABSH Science Fair Rubric (Categories A and B)
// and the 2026-2027 Addendum, pages 13-17 (STEAM Invention & Innovation, STEAM Robotics).

export const FAIR = "2026-27";                       // a new id starts a new fair with empty scores
export const FAIR_NAME = "Science & STEAM Fair 2026–2027";

/* ---------- rubrics ---------- */
// "levels" rubric: each criterion has 5 fixed point values (one per level).
// "range" rubric: each criterion takes any whole number from 1 to max; "bands" describe the ranges.
export const RUBRICS = {
  sci: {
    name: "ABSH Science Fair Rubric (Categories A and B)",
    kind: "levels",
    levelNames: ["Absent or Inaccurate", "Weak", "Average", "Above Average", "Outstanding"],
    comments: [
      { id: "c1", label: "Positive comment 1" },
      { id: "c2", label: "Positive comment 2" },
      { id: "sugg", label: "One positive suggestion" }
    ],
    groups: [
      { name: "The Scientific Method and Its Applications", items: [
        { id: "question", title: "Scientific question or problem", desc: "Student(s) demonstrates a creative approach to explore a real-life scientific question or problem.", values: [2, 4, 6, 8, 10] },
        { id: "hypothesis", sub: "Methodology", title: "Hypothesis", desc: "A testable hypothesis clearly stated.", values: [1, 2, 3, 4, 5] },
        { id: "procedure", sub: "Methodology", title: "Procedure", desc: "The procedure clearly explains each step of the experiment in a way that tests the hypothesis, making use of multiple trials.", values: [2, 4, 6, 8, 10] },
        { id: "variable", sub: "Methodology", title: "Variable", desc: "Student(s) can identify the independent and dependent variables. Other factors in the experiment are controlled as to avoid impacting the relationship between the variables.", values: [1, 2, 3, 4, 5] },
        { id: "datacoll", sub: "Methodology", title: "Data Collection", desc: "Data was collected in a consistent way. Qualitative / quantitative measurements have been made. Experimentation demonstrates multiple trials.", values: [1, 2, 3, 4, 5] },
        { id: "conclusion", sub: "Methodology", title: "Conclusion", desc: "Student(s) can support, through evidence from the experiment, a claim to support or reject the hypothesis.", values: [1, 2, 3, 4, 5] },
        { id: "analysis", title: "Data Analysis", desc: "Student(s) gathered data and have clearly communicated its analysis through a logbook, charts, and graphs. Statistical analysis of data has been completed.", values: [4, 8, 12, 16, 20] },
        { id: "knowledge", title: "Scientific knowledge", desc: "Student(s) demonstrate, through an oral presentation, the display, and a research paper, understanding of scientific concepts used through experimentation and data analysis. A research paper uses proper citation of multiple sources.", values: [4, 8, 12, 16, 20] }
      ]},
      { name: "Presentation", items: [
        { id: "display", title: "Display", desc: "The display clearly reflects the scientific process used in the project.", values: [2, 4, 6, 8, 10] },
        { id: "presentation", title: "Presentation", desc: "Student(s) clearly communicate the scientific process used in the project.", values: [2, 4, 6, 8, 10] }
      ]}
    ]
  },
  inv: {
    name: "Invention and Innovation Project Rubric (STEAM)",
    kind: "range",
    comments: [],
    groups: [
      { name: "1. Problem Identification & Research (15%)", items: [
        { id: "problem", title: "Clear Problem Statement", max: 5, bands: ["5-4: Problem is well-defined, relevant, and has a clear scope.", "3-2: Somewhat clear but lacks precision.", "1: Vague or poorly defined."] },
        { id: "research", title: "Research and Background Information", max: 10, bands: ["10-8: Extensive research, detailed understanding of problem.", "7-4: Sufficient research, some understanding.", "3-1: Limited research."] }
      ]},
      { name: "2. Innovation and Creativity (15%)", items: [
        { id: "originality", title: "Originality of the Idea", max: 5, bands: ["5-4: Highly original and novel idea.", "3-2: Some originality, introduces new concepts.", "1: Lacks originality."] },
        { id: "creativity", title: "Creativity in Design and Implementation", max: 10, bands: ["10-8: Highly creative, deep interdisciplinary thinking.", "7-4: Good integration, lacks depth in some areas.", "3-1: Minimal integration."] }
      ]},
      { name: "3. Engineering and Technical Design (20%)", items: [
        { id: "feasibility", title: "Technical Feasibility and Functionality", max: 10, bands: ["10-8: Fully functional prototype, technically sound.", "7-4: Functional with minor issues.", "3-1: Incomplete or non-functional."] },
        { id: "build", title: "Design and Build Quality", max: 10, bands: ["10-8: High-quality design and build, appropriate materials.", "7-4: Good design, some flaws.", "3-1: Poor design or materials."] }
      ]},
      { name: "4. Integration of STEAM Disciplines (15%)", items: [
        { id: "scimath", title: "Science & Mathematics Application", max: 5, bands: ["5-4: Strong use of science and math.", "3-2: Some application, lacks depth.", "1: Minimal or no application."] },
        { id: "techeng", title: "Technology & Engineering Application", max: 5, bands: ["5-4: Extensive use of technology and engineering.", "3-2: Good use, could be improved.", "1: Minimal application."] },
        { id: "artistic", title: "Artistic and Creative Design", max: 5, bands: ["5-4: Well-integrated, enhances functionality and aesthetics.", "3-2: Some creative elements.", "1: Little creativity."] }
      ]},
      { name: "5. Prototype Testing and Evaluation (15%)", items: [
        { id: "testing", title: "Testing Process", max: 10, bands: ["10-8: Rigorous testing, well-documented.", "7-4: Basic testing, minor iterations.", "3-1: Minimal or no testing."] },
        { id: "effectiveness", title: "Effectiveness and Impact", max: 5, bands: ["5-4: Highly effective, significant impact.", "3-2: Moderate effectiveness and impact.", "1: Little effectiveness."] }
      ]},
      { name: "6. Presentation and Communication (15%)", items: [
        { id: "notebook", title: "Engineering Notebook", max: 5, bands: ["5-4: Detailed and well-organized.", "3-2: Covers most components, lacks detail.", "1: Incomplete or poorly organized."] },
        { id: "oral", title: "Oral Presentation", max: 5, bands: ["5-4: Clear, confident, engaging.", "3-2: Decent, but lacks effectiveness.", "1: Poorly delivered, unclear."] },
        { id: "visual", title: "Visual Display and Prototype Demonstration", max: 5, bands: ["5-4: Creative and informative.", "3-2: Good, but could be more creative.", "1: Basic or ineffective."] }
      ]},
      { name: "7. Impact and Real World Application (5%)", items: [
        { id: "impact", title: "Potential Impact", max: 3, bands: ["3: High potential impact, well-defined application.", "2: Moderate impact, could be expanded.", "1: Little impact."] },
        { id: "future", title: "Future Development", max: 2, bands: ["2: Clear potential for scaling, innovative ideas.", "1: Some potential, basic ideas."] }
      ]}
    ]
  },
  rob: {
    name: "Robotics Projects Rubric (STEAM)",
    kind: "range",
    comments: [],
    groups: [
      { name: "1. Problem Identification & Research (15%)", items: [
        { id: "problem", title: "Clear Problem Statement", max: 5, bands: ["5-4: Clearly defines a significant, real world problem related to robotics.", "3-2: Problem is somewhat clear, relevant, but lacks precision.", "1: Vague or poorly defined problem."] },
        { id: "research", title: "Research and Background Information", max: 10, bands: ["10-8: Extensive research demonstrating a thorough understanding of the problem and existing robotic solutions.", "7-4: Adequate research, some understanding of existing solutions.", "3-1: Limited research, minimal understanding."] }
      ]},
      { name: "2. Engineering Design and Technical Implementation (25%)", items: [
        { id: "design", title: "Robot Design and Innovation", max: 10, bands: ["10-8: Highly innovative robot design with unique features and capabilities.", "7-4: Good design with some innovative elements.", "3-1: Basic design with minimal innovation."] },
        { id: "programming", title: "Programming and Control Systems", max: 10, bands: ["10-8: Well-implemented programming with complex control systems and effective use of sensors/actuators.", "7-4: Adequate programming and control, minor issues.", "3-1: Basic programming, limited control."] },
        { id: "construction", title: "Construction and Build Quality", max: 5, bands: ["5-4: High-quality build, robust construction with appropriate materials.", "3-2: Good build quality, some flaws in construction.", "1: Poor construction, weak materials, or unfinished."] }
      ]},
      { name: "3. Functionality and Performance (20%)", items: [
        { id: "function", title: "Functionality and Operation", max: 10, bands: ["10-8: Robot functions as intended, demonstrating complex tasks or operations effectively.", "7-4: Functions adequately with minor issues or limitations.", "3-1: Limited functionality, significant issues."] },
        { id: "testing", title: "Testing and Optimization", max: 10, bands: ["10-8: Extensive testing with multiple iterations and optimizations documented.", "7-4: Adequate testing and optimization, some areas not addressed.", "3-1: Minimal testing, little or no optimization."] }
      ]},
      { name: "4. Integration of STEAM Disciplines (15%)", items: [
        { id: "scimath", title: "Science & Mathematics Application", max: 5, bands: ["5-4: Strong application of scientific principles and mathematical modeling in the design and function.", "3-2: Some application, but lacks depth.", "1: Minimal or no application."] },
        { id: "techeng", title: "Technology & Engineering Integration", max: 5, bands: ["5-4: Effective integration of technology and engineering principles in the robot's design and function.", "3-2: Good integration but could be improved.", "1: Minimal integration."] },
        { id: "artistic", title: "Artistic and Creative Design", max: 5, bands: ["5-4: Creative design elements that enhance functionality and aesthetics.", "3-2: Some creative elements, but not well integrated.", "1: Little to no creative design."] }
      ]},
      { name: "5. Documentation and Presentation (15%)", items: [
        { id: "journal", title: "Engineering Journal", max: 5, bands: ["5-4: Detailed, well-organized journal documenting the entire engineering design process.", "3-2: Good documentation but lacks some details.", "1: Minimal or no documentation."] },
        { id: "report", title: "Project Report", max: 5, bands: ["5-4: Comprehensive report covering problem, research, design, implementation, and results.", "3-2: Report covers most components, but lacks detail.", "1: Incomplete or poorly organized report."] },
        { id: "oral", title: "Oral Presentation and Visual Display", max: 5, bands: ["5-4: Clear, confident presentation with engaging visual aids and effective demonstration.", "3-2: Decent presentation, some areas could be clearer.", "1: Poorly delivered, ineffective communication."] }
      ]},
      { name: "6. Impact and Real World Application (10%)", items: [
        { id: "relevance", title: "Real-World Relevance", max: 5, bands: ["5-4: Project addresses a real-world problem with significant potential impact.", "3-2: Some relevance and impact, but limited scope.", "1: Minimal relevance, unclear impact."] },
        { id: "future", title: "Future Development", max: 5, bands: ["5-4: Clear potential for scaling, with innovative ideas for future development.", "3-2: Some potential for scaling, basic future plans.", "1: No clear potential for scaling or future development."] }
      ]}
    ]
  }
};
export const items = rubric => RUBRICS[rubric].groups.flatMap(g => g.items);
export const maxOf = it => it.values ? Math.max(...it.values) : it.max;
export const rubricTotal = (rubric, crit) => items(rubric).reduce((a, it) => a + (Number((crit || {})[it.id]) || 0), 0);
export const rubricComplete = (rubric, crit) => items(rubric).every(it => (crit || {})[it.id] !== undefined && (crit || {})[it.id] !== null);

/* ---------- categories and divisions ---------- */
export const CATS = {
  A: { name: "Category A", short: "Cat A", rule: "1–2 students from the same grade (7th–11th)", min: 1, max: 2 },
  B: { name: "Category B", short: "Cat B", rule: "3–4 students; grades can mix within 7th–9th or within 10th–11th", min: 3, max: 4 },
  STEAM: { name: "STEAM", short: "STEAM", rule: "1–3 students from 7th–9th or 10th–11th", min: 1, max: 3 },
  X: { name: "Not judged (demo / exhibition)", short: "Not judged", rule: "Shown on the list but not scored or ranked", min: 0, max: 99 }
};
export const STEAM_TYPES = { inv: "Invention & Innovation", rob: "Robotics" };
export const GRADE_LEVELS = ["7", "8", "9", "10", "11"];
export const SPLIT_LEVELS = ["7-9", "10-11"];
export const levelsFor = cat => (cat === "A" ? GRADE_LEVELS : cat === "B" || cat === "STEAM" ? SPLIT_LEVELS : []);
export const levelName = l => ({ "7": "7th grade", "8": "8th grade", "9": "9th grade", "10": "10th grade", "11": "11th grade", "7-9": "7th–9th", "10-11": "10th–11th" }[l] || "");

export const rubricOf = p => (p.cat === "A" || p.cat === "B" ? "sci" : p.cat === "STEAM" ? (p.stype === "rob" ? "rob" : "inv") : null);
export const judged = p => !!rubricOf(p);
// Ranking groups: Cat A by grade; Cat B by 7-9 / 10-11; STEAM by 7-9 / 10-11.
export const divKey = p => (judged(p) ? `${p.cat}|${levelsFor(p.cat).includes(p.level) ? p.level : "?"}` : null);
export const DIV_ORDER = [
  ...GRADE_LEVELS.map(l => `A|${l}`), "A|?",
  ...SPLIT_LEVELS.map(l => `B|${l}`), "B|?",
  ...SPLIT_LEVELS.map(l => `STEAM|${l}`), "STEAM|?"
];
export const divLabel = k => { const [c, l] = k.split("|"); return `${CATS[c].name} · ${l === "?" ? "division not set yet" : levelName(l)}`; };

export const memberList = p => String(p.members || "").split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
export function warnings(p) {
  const w = [], n = memberList(p).length, c = CATS[p.cat];
  if (!p.title) w.push("No project name");
  if (!c) w.push("No category");
  else if (p.cat !== "X" && (n < c.min || n > c.max)) w.push(`${c.short} allows ${c.min}–${c.max} students; this group has ${n}`);
  if (judged(p) && !levelsFor(p.cat).includes(p.level)) w.push(p.cat === "A" ? "Choose the grade" : "Choose 7th–9th or 10th–11th");
  if (p.note) w.push(p.note);
  return w;
}
