import { useEffect, useRef, useState } from "react";
import { AGENTS, AGENT_TYPE_LABEL, type AgentInfo, type AgentType } from "../data/agents";
import { demoTrace, type TraceLine } from "../lib/demo";
import { useReveal } from "../lib/useReveal";
import { PlayIcon, StopIcon, TerminalIcon, ExtIcon, CheckIcon, XIcon, ChipIcon, SparkIcon } from "../components/Icons";

const TYPE_FILTERS: { id: AgentType | "all"; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "cli", label: "CLI" },
  { id: "ide", label: "IDE" },
  { id: "ext", label: "Розширення" },
  { id: "web", label: "Web / SaaS" },
  { id: "lib", label: "Бібліотеки" },
];

export default function AgentsPage() {
  const [filter, setFilter] = useState<AgentType | "all">("all");
  const [agentId, setAgentId] = useState("claude-code");
  const [task, setTask] = useState("Додай валідацію форми реєстрації на zod з повідомленнями українською");
  const [lines, setLines] = useState<TraceLine[]>([]);
  const [running, setRunning] = useState(false);
  const timeouts = useRef<number[]>([]);
  const termRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);
  const ref = useReveal<HTMLDivElement>([filter]);

  const list = AGENTS.filter((a) => filter === "all" || a.type === filter);
  const agent = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  function run() {
    if (running || !task.trim()) return;
    const trace = demoTrace(task.trim(), agent);
    setLines([]);
    setRunning(true);
    let t = 250;
    trace.forEach((l, i) => {
      t += l.delay;
      timeouts.current.push(
        window.setTimeout(() => {
          setLines((prev) => [...prev, l]);
          if (i === trace.length - 1) setRunning(false);
        }, t)
      );
    });
  }

  function abortRun() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setRunning(false);
    setLines((prev) => [...prev, { kind: "warn", text: "⏹ зупинено користувачем — часткові правки збережено у stash", delay: 0 }]);
  }

  function launch(a: AgentInfo) {
    setAgentId(a.id);
    runnerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={ref} className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 max-md:px-4">
      {/* заголовок */}
      <div className="reveal">
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lilac">
          <TerminalIcon className="h-3.5 w-3.5" /> окрема кімната для кодерів
        </p>
        <h1 className="font-display text-[clamp(26px,3.4vw,40px)] font-bold leading-tight text-fog">
          Агенти-кодери
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-dim">
          {AGENTS.length} автономних інженерів: від термінальних CLI до повних SaaS-команд. Обери свого,
          запусти демо-трейс нижче — і підключи його до будь-якого провайдера зі студії.
        </p>
      </div>

      {/* фільтри */}
      <div className="reveal mt-6 flex flex-wrap gap-2" style={{ transitionDelay: "80ms" }}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md border px-3 py-1.5 text-[12.5px] transition-all ${
              filter === f.id
                ? "border-lilac/60 bg-lilac/12 font-semibold text-lilac"
                : "border-line bg-ink-850 text-dim hover:border-line2 hover:text-fog"
            }`}
          >
            {f.label}
            <span className="ml-1 font-mono text-[10.5px] opacity-70">
              {f.id === "all" ? AGENTS.length : AGENTS.filter((a) => a.type === f.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* сітка карток */}
      <div className="mt-6 grid grid-cols-2 gap-3.5 max-lg:grid-cols-1">
        {list.map((a, i) => (
          <article
            key={a.id}
            className="reveal group relative rounded-xl border border-line bg-ink-900/70 p-4 transition-all hover:-translate-y-0.5 hover:bg-ink-850"
            style={{ transitionDelay: `${Math.min(i, 8) * 45}ms`, borderColor: undefined }}
          >
            {/* кутові дужки */}
            <Corners c={a.accent} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[15px] font-semibold text-fog">{a.name}</h3>
                <p className="mt-0.5 font-mono text-[11px] text-faint">{a.vendor}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: a.accent, borderColor: `${a.accent}44`, background: `${a.accent}0f` }}>
                  {AGENT_TYPE_LABEL[a.type]}
                </span>
                {a.open && (
                  <span className="flex items-center gap-1 rounded border border-tealic/35 px-2 py-0.5 font-mono text-[10px] text-tealic">
                    <CheckIcon className="h-2.5 w-2.5" /> {a.license ?? "open"}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-dim">{a.blurb}</p>

            <ul className="mt-3 space-y-1.5">
              {a.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-dim">
                  <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: a.accent }} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 font-mono text-[10.5px] text-faint">
              <span className="flex items-center gap-1"><ChipIcon className="h-3 w-3" />{a.models}</span>
              {a.stars && <span>⭐ {a.stars}k</span>}
              <span className={a.mcp ? "text-mint" : "text-faint"}>{a.mcp ? "MCP ✓" : "без MCP"}</span>
              <span className="ml-auto text-dim">{a.price}</span>
            </div>

            <div className="mt-3.5 flex gap-2">
              <button
                onClick={() => launch(a)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12.5px] font-semibold text-ink-950 transition-all hover:brightness-110 hover:shadow-lg"
                style={{ background: a.accent }}
              >
                <PlayIcon className="h-3.5 w-3.5" /> Демо-запуск
              </button>
              <span className="flex items-center rounded-lg border border-line bg-ink-800 px-3 font-mono text-[12px] text-dim">
                $ {a.cmd}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ---- термінальний ранер ---- */}
      <div ref={runnerRef} className="reveal mt-12 scroll-mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-[20px] font-bold text-fog">Термінал симуляції</h2>
          <span className="rounded border border-line bg-ink-850 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-faint">
            демо-трейс · не витрачає токенів
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-ink-900/80">
          {/* керування */}
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-ink-850/80 px-4 py-3">
            <label className="font-mono text-[11px] uppercase tracking-wider text-faint">Агент</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={running}
              className="rounded-lg border border-line bg-ink-900 px-2.5 py-1.5 text-[13px] text-fog outline-none transition-colors focus:border-lilac/60 disabled:opacity-50"
            >
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {AGENT_TYPE_LABEL[a.type]}</option>
              ))}
            </select>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              disabled={running}
              placeholder="Опиши задачу для агента…"
              className="field min-w-[220px] flex-1 disabled:opacity-50"
            />
            {running ? (
              <button onClick={abortRun} className="flex items-center gap-2 rounded-lg bg-coral/15 px-4 py-2 text-[13px] font-semibold text-coral transition-colors hover:bg-coral/25">
                <StopIcon className="h-3.5 w-3.5" /> Зупинити
              </button>
            ) : (
              <button
                onClick={run}
                disabled={!task.trim()}
                className="flex items-center gap-2 rounded-lg bg-lilac px-4 py-2 text-[13px] font-semibold text-ink-950 transition-all enabled:hover:shadow-[0_0_18px_rgba(183,149,255,0.35)] disabled:opacity-40"
              >
                <PlayIcon className="h-3.5 w-3.5" /> Запустити
              </button>
            )}
          </div>

          {/* термінал */}
          <div className="term-scan relative bg-[#070a0f]">
            <div className="flex items-center gap-1.5 border-b border-line/60 px-4 py-2">
              {["#ff6b6b", "#ffd166", "#3ecf8e"].map((c) => (
                <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c, opacity: 0.75 }} />
              ))}
              <span className="ml-2 font-mono text-[11px] text-faint">~/projects/app — {agent.cmd} · {agent.vendor}</span>
              {running && <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-lilac"><SparkIcon className="h-3 w-3 animate-pulse" /> працює…</span>}
            </div>
            <div ref={termRef} className="h-[340px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
              {lines.length === 0 && !running && (
                <p className="text-faint">
                  <span className="text-ember">$</span> Натисни «Запустити», щоб побачити, як {agent.name} розбирає задачу:
                  читання файлів, план, правки, прогін тестів і коміт.
                </p>
              )}
              {lines.map((l, i) => (
                <TraceRow key={i} l={l} />
              ))}
              {running && <span className="caret" />}
            </div>
          </div>
        </div>
      </div>

      {/* ---- порівняльна матриця ---- */}
      <div className="reveal mt-12">
        <h2 className="mb-4 font-display text-[20px] font-bold text-fog">Порівняльна матриця</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-ink-900/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-ink-850/80">
                  {["Агент", "Тип", "Open source", "MCP", "⭐ GitHub", "Ціна"].map((h) => (
                    <th key={h} className="px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((a) => (
                  <tr key={a.id} onClick={() => setAgentId(a.id)} className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-ink-800/70">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-fog">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.accent }} />
                        {a.name}
                        {agentId === a.id && <span className="font-mono text-[9.5px] uppercase text-lilac">← у терміналі</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] text-dim">{AGENT_TYPE_LABEL[a.type]}</td>
                    <td className="px-4 py-2.5">
                      {a.open ? (
                        <span className="flex items-center gap-1 font-mono text-[11.5px] text-tealic"><CheckIcon className="h-3 w-3" />{a.license}</span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono text-[11.5px] text-faint"><XIcon className="h-3 w-3" />пропрієтарний</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {a.mcp ? <span className="font-mono text-[11.5px] text-mint">✓</span> : <span className="font-mono text-[11.5px] text-faint">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-dim">{a.stars ? `${a.stars}k` : "n/a"}</td>
                    <td className="px-4 py-2.5 text-[12.5px] text-dim">{a.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-faint">
          <ExtIcon className="h-3 w-3" />
          MCP — Model Context Protocol: стандарт підключення тулз і даних до агента.
        </p>
      </div>
    </div>
  );
}

function TraceRow({ l }: { l: TraceLine }) {
  const style: Record<TraceLine["kind"], string> = {
    cmd: "text-fog",
    head: "text-lilac",
    tool: "text-cyanic",
    file: "text-dim",
    ok: "text-mint",
    warn: "text-solar",
    info: "text-dim",
    diff: "",
  };
  if (l.kind === "cmd") {
    return (
      <p className="term-line">
        <span className="text-ember">$</span> <span className="text-fog">{l.text.replace(/^\$\s*/, "")}</span>
      </p>
    );
  }
  if (l.kind === "diff") {
    const add = l.text.trim().startsWith("+");
    return <p className={`term-line whitespace-pre ${add ? "text-mint" : "text-coral"}`}>{l.text}</p>;
  }
  return <p className={`term-line whitespace-pre-wrap ${style[l.kind]}`}>{l.text}</p>;
}

function Corners({ c }: { c: string }) {
  const base = "pointer-events-none absolute h-3 w-3 border-current opacity-0 transition-opacity duration-300 group-hover:opacity-100";
  return (
    <span style={{ color: c }} aria-hidden>
      <span className={`${base} left-1.5 top-1.5 border-l border-t`} />
      <span className={`${base} right-1.5 top-1.5 border-r border-t`} />
      <span className={`${base} bottom-1.5 left-1.5 border-b border-l`} />
      <span className={`${base} bottom-1.5 right-1.5 border-b border-r`} />
    </span>
  );
}
