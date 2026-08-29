/* Task decomposition: every brief is split into subtasks owned by a
   specialist role — Architect, UI Designer, Frontend Engineer,
   Technical Writer, QA Engineer. The Coder executes them in order. */

export interface Role {
  id: string;
  short: string;
  title: string;
  color: string;
}

export const ROLES: Record<string, Role> = {
  arch: { id: "arch", short: "ARCH", title: "Architect", color: "#ffc24b" },
  ui: { id: "ui", short: "UI", title: "UI Designer", color: "#5ac8e8" },
  fe: { id: "fe", short: "FE", title: "Frontend Engineer", color: "#31e5ae" },
  fs: { id: "fs", short: "FS", title: "Fullstack Engineer", color: "#31e5ae" },
  doc: { id: "doc", short: "DOC", title: "Technical Writer", color: "#c9a0ff" },
  qa: { id: "qa", short: "QA", title: "QA Engineer", color: "#ff8a5c" },
};

export interface Subtask {
  id: string;
  role: string;
  label: string;
  produces?: string;
  state: "wait" | "run" | "done";
}

/* specialist notes per template + file */
const NOTES: Record<string, Record<string, string>> = {
  todo: {
    "index.html": "input row, list & counter skeleton",
    "styles.css": "soft card UI, strikethrough done-states",
    "app.js": "CRUD state machine + localStorage persistence",
    "README.md": "usage notes & data format",
  },
  landing: {
    "index.html": "hero, menu cards, about & hours sections",
    "styles.css": "editorial serif type, warm palette",
    "app.js": "dynamic footer year",
    "README.md": "section map & run notes",
  },
  dashboard: {
    "index.html": "KPI stat cards + chart card",
    "styles.css": "responsive grid, trend colors",
    "app.js": "SVG polyline renderer, week/month toggle",
    "README.md": "metrics definitions",
  },
  snake: {
    "index.html": "canvas board + score panel",
    "styles.css": "dark arcade theme",
    "app.js": "game loop, collisions, speed-up logic",
    "README.md": "controls & rules",
  },
  pomodoro: {
    "index.html": "mode switch + SVG progress ring",
    "styles.css": "calm focus palette",
    "app.js": "timer engine, ring dash-offset",
    "README.md": "modes & focus tips",
  },
  notes: {
    "index.html": "sidebar list + editor split",
    "styles.css": "two-pane workspace layout",
    "app.js": "autosave + mini-markdown renderer",
    "README.md": "storage format notes",
  },
  generic: {
    "index.html": "starter screen skeleton",
    "styles.css": "minimal brand-neutral theme",
    "app.js": "counter interaction",
    "README.md": "project brief",
  },
};

function fileSubtask(templateId: string, file: string): Subtask {
  const note = NOTES[templateId]?.[file];
  let role = "fe";
  let label = note ?? "implementation";
  if (file.endsWith(".html")) {
    role = "ui";
    label = note ?? "semantic markup & page structure";
  } else if (file.endsWith(".css")) {
    role = "ui";
    label = note ?? "design system: palette, type & layout";
  } else if (file.toLowerCase().endsWith(".md")) {
    role = "doc";
    label = note ?? "documentation & usage notes";
  }
  return { id: file, role, label, produces: file, state: "wait" };
}

/** Builds the specialist plan for a template-based project. */
export function buildPlan(templateId: string, files: string[]): Subtask[] {
  return [
    {
      id: "plan",
      role: "arch",
      label: `Decompose brief into ${files.length + 1} subtasks by specialty`,
      state: "wait",
    },
    ...files.map((f) => fileSubtask(templateId, f)),
    { id: "qa", role: "qa", label: "Build bundle & smoke-test the preview", state: "wait" },
  ];
}

/** Builds the plan when a real LLM generates the project. */
export function buildLLMPlan(modelName: string): Subtask[] {
  return [
    { id: "plan", role: "arch", label: "Decompose brief & draft the spec", state: "wait" },
    { id: "app", role: "fs", label: `Generate the full app via ${modelName}`, produces: "index.html", state: "wait" },
    { id: "doc", role: "doc", label: "Write project documentation", produces: "README.md", state: "wait" },
    { id: "qa", role: "qa", label: "Build bundle & smoke-test the preview", state: "wait" },
  ];
}

export function uniqueRoles(plan: Subtask[]): Role[] {
  const seen = new Map<string, Role>();
  for (const s of plan) if (!seen.has(s.role)) seen.set(s.role, ROLES[s.role]);
  return [...seen.values()];
}
