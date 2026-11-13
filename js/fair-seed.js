// The fair projects from the fair list, used once by "Load the projects from the list" on fair-admin.html.
// Students' full names and grades come from the 7th–11th student list; the grades set each division. Categories come from the
// project list (STEAM when it says STEAM, invention or innovation; otherwise Category A for 1–2
// students and Category B for 3–4). Anything that needs a decision has a note. Fix it all on the teacher page.
const L = [
  { num: 1, title: "Bioplastic", members: "Hebryl Gisselle Calix Torres, Vallery Dessire Calix Betance, Kristel Daniela Caballero Rivera, Stephanie Samantha Roca Gutierrez", field: "STEAM", cat: "B", level: "10-11" },
  { num: 2, title: "Plants Vegetation Soil Eroison", members: "Marcos Rene Navas Sabillon, Daniel Andrés Urbina Andino, Ruth Elizabeth Argeñal Bonilla, Gabriel Eduardo Ardon Nataren", field: "Earth Science", cat: "B", level: "10-11" },
  { num: 3, title: "Plant Nanny", members: "Isaac Josue Gaitan Rapalo, Luis Rolando Serrano Castillo, Cesar Edgardo Reyes Lardi", field: "STEAM", cat: "STEAM", level: "10-11", },
  { num: 4, title: "Volcan", members: "Jaeden Nathaniel Williams Martinez", field: "Demo", cat: "X", level: "10", note: "Demo: not judged for now. To judge it, choose Category A (10th grade is already set)" },
  { num: 5, title: "Organic Fertalizer", members: "Naislhy Victoria Ponce Santos, Yolanda Donatella Sanchez Mancia", field: "Life Science", cat: "A", level: "8" },
  { num: 6, title: "Algas como Biocombustible", members: "Jose Reynaldo Mejia Rodriguez, Abraham Josue Meraz Gonzales, Dylan Jusethe Aguilar Mejia", field: "Life Science", cat: "B", level: "7-9" },
  { num: 7, title: "Cleaning Robot o Wall-E", members: "Scarleth Ivania Sabillon Gomez, Aubrie Isabella Mckennon Molina, Lessy Andrea Lozano Castro", field: "STEAM", cat: "STEAM", stype: "rob", level: "7-9" },
  { num: 8, title: "Eco-Pave", members: "Oscar Ramon Martinez Ucles, Andy Jassel Zelaya Martinez, David Esau Cortes Murillo", field: "Earth Science", cat: "B", level: "7-9" },
  { num: 9, title: "Biopreserve", members: "Iguemeri Martinez Webster", field: "STEAM", cat: "STEAM", level: "7-9" },
  { num: 10, title: "Solar Electricity", members: "Amy Michelle Salgado Reyes, Jimena Alessandra Ordoñez Flores", field: "Inventions and innovations", cat: "STEAM", level: "7-9" },
  { num: 11, title: "Hair Serum", members: "Maria Fernanda Galeano Ayala, Lucia Anabelle Chiessa Mejía, Ximena Abigail Rivera Salgado, Aubry Valentina Cisneros Bustillo", field: "Life Science", cat: "B", level: "7-9" },
  { num: 12, title: "Spanish Ditector", members: "Eda Carolina Montoya Martinez", field: "STEAM", cat: "STEAM", level: "7-9" },
  { num: 13, title: "AI Coach", members: "Daniel Alejandro Rivera Mejía, Gilberto Carcamo Martinez, Ruben Sebastian Mejía Moncada", field: "STEAM", cat: "STEAM", level: "10-11" },
  { num: 14, title: "The 5 Second Rule", members: "Andrew Alejandro Martinez Gonzalez, Carlos Andres Aguirre Martinez", field: "Biology and Health · Life Science", cat: "A", level: "7" },
  { num: 15, title: "Biodegradable Plastic from Plantain", members: "Carlos Alberto Valdez Carcamo, Carla Maria Hernandez Lagos, Katherine Camila Garcia Andino", field: "STEAM (Life Science)", cat: "STEAM", level: "7-9" },
  { num: 16, title: "Harvesting Water from Condensation", members: "Sadia Yulie Mendoza Degrande, Dana Marie Zelaya Bautista, Lissa Dayan Mejia Mayorga", field: "STEAM", cat: "STEAM", level: "10-11" },
  { num: 17, title: "Terremotus Immunis", members: "Gizelle Amerie Welcome Zavala, Giorgia Spina", field: "STEAM inventions and innovations", cat: "STEAM", level: "10-11" },
  { num: 18, title: "Sonic Extinguisher", members: "Danna Isabella Flores Ortiz, Fares Jafeth Flores Ortiz, André Josué Urbina Andino", field: "STEAM inventions and innovations", cat: "STEAM", level: "7-9" },
  { num: 19, title: "Microbial Pressure", members: "Sophie Nazzareth Ham Ramos, Mía Antonella Mendoza Funez", field: "Science", cat: "A", level: "7" },
  { num: 20, title: "Electrolyte Race", members: "Angel Josue Díaz Cano, Ari Manaces Rodriguez Diaz", field: "Science", cat: "A", level: "10" },
  { num: 21, title: "Ice Shaving Instantanea", members: "Katherine Sofia Matute Ruiz, Scarleth Celine Cardona Guillen, Zoe Alessandra Galeas Torres", field: "Innovation", cat: "STEAM", level: "7-9" },
  { num: 22, title: "", members: "Danny Hubert Greenwood Murillo", field: "", cat: "A", level: "8", note: "No project name or category in the list" },
  { num: 23, title: "Protesis", members: "Marvin Jean Carlo Reyes Ordoñez", field: "STEAM", cat: "STEAM", level: "7-9" },
  { num: 24, title: "Omny-Directional Maneuver", members: "Jade Larissa Mendoza Funez", field: "Inventions and innovation", cat: "STEAM", level: "10-11" },
  { num: 25, title: "Hydrogen Generator", members: "Alexi Yosimar Bonilla Gonzalez, Deyshan Yobao Guerrero Alvarez", field: "STEAM inventions and innovations", cat: "STEAM", level: "10-11" }
];

export const SEED = Object.fromEntries(L.map(p => ["p" + String(p.num).padStart(2, "0"), {
  num: p.num, title: p.title, members: p.members, field: p.field, cat: p.cat,
  stype: p.cat === "STEAM" ? (p.stype || "inv") : "", level: p.level, note: p.note || ""
}]));
