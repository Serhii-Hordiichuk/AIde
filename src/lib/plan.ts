/* Task decomposition by specialty — the Coder's crew. */

export type RoleId = "arch" | "ui" | "fe" | "doc" | "qa";

export interface Subtask {
  id: string;
  role: RoleId;
  label: string;
  state: "wait" | "run" | "done";
  produces?: string;
}

export interface RoleDef {
  short: string;
  color: string;
  title: string;
}

export const ROLES: Record<RoleId, RoleDef> = {
  arch: { short: "ARCH", color: "#ffc24b", title: "Architect" },
  ui: { short: "UI", color: "#58c4dd", title: "UI Designer" },
  fe: { short: "FE", color: "#8b7cff", title: "Frontend Engineer" },
  doc: { short: "DOC", color: "#c9a0ff", title: "Technical Writer" },
  qa: { short: "QA", color: "#ff8a5c", title: "QA Engineer" },
};

function roleForFile(name: string): RoleId {
  const n = name.toLowerCase();
  if (n.endsWith(".md")) return "doc";
  if (n.endsWith(".css") || n.endsWith(".html")) return "ui";
  return "fe";
}

/** Builds a concrete plan from the files the built-in generator will ship. */
export function buildPlan(_templateId: string, fileNames: string[]): Subtask[] {
  const plan: Subtask[] = [
    { id: "plan", role: "arch", label: "Analyzed brief & decomposed", state: "done" },
  ];
  for (const f of fileNames) {
    plan.push({
      id: f,
      role: roleForFile(f),
      label: `Write ${f}`,
      state: "wait",
      produces: f,
    });
  }
  plan.push({ id: "qa", role: "qa", label: "Build & smoke test", state: "wait" });
  return plan;
}

/** Plan shown when a live free model generates the whole project. */
export function buildLLMPlan(modelName: string): Subtask[] {
  return [
    { id: "plan", role: "arch", label: "Analyzed brief & decomposed", state: "done" },
    { id: "fs", role: "fe", label: `Generate project with ${modelName}`, state: "wait" },
    { id: "doc", role: "doc", label: "Write README", state: "wait" },
    { id: "qa", role: "qa", label: "Build & smoke test", state: "wait" },
  ];
}

export function uniqueRoles(plan: Subtask[]): RoleDef[] {
  const seen = new Set<RoleId>();
  const out: RoleDef[] = [];
  for (const s of plan) {
    if (!seen.has(s.role)) {
      seen.add(s.role);
      out.push(ROLES[s.role]);
    }
  }
  return out;
}
