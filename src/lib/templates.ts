/* AiDe Coder built-in generator — compositional, not cookie-cutter.
   Every build derives its theme (palette, fonts, dark/light) from the prompt's
   topic and injects the brief's own words into the copy, so two different
   prompts produce two visibly different apps. */

export interface TemplateDef {
  id: string;
  label: string;
  keywords: string[];
  build: (name: string, desc: string) => Record<string, string>;
}

/* ---------------- theme derivation ---------------- */

interface Theme {
  primary: string;
  deep: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  dark: boolean;
  heading: string;
  body: string;
}

const TOPICS: { keys: string[]; t: Partial<Theme> }[] = [
  { keys: ["coffee", "cafe", "roast", "espresso", "кав"], t: { primary: "#a4552f", deep: "#6f3a1f", bg: "#faf6f0", surface: "#ffffff", text: "#2b2118", muted: "#6b5847", dark: false, heading: "Georgia, 'Times New Roman', serif", body: "system-ui, sans-serif" } },
  { keys: ["code", "dev", "tech", "startup", "saas", "api", "program"], t: { primary: "#0ea5a0", deep: "#0b7c78", bg: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e", dark: true, heading: "ui-monospace, 'Cascadia Code', monospace", body: "system-ui, sans-serif" } },
  { keys: ["finance", "bank", "crypto", "invest", "budget", "money"], t: { primary: "#16a34a", deep: "#117a38", bg: "#0e1512", surface: "#14201a", text: "#e7f5ec", muted: "#86a896", dark: true, heading: "system-ui, sans-serif", body: "system-ui, sans-serif" } },
  { keys: ["fitness", "gym", "yoga", "health", "workout", "sport"], t: { primary: "#e85d2f", deep: "#b8431c", bg: "#12100e", surface: "#1c1815", text: "#f5ede8", muted: "#a8968a", dark: true, heading: "'Arial Black', system-ui, sans-serif", body: "system-ui, sans-serif" } },
  { keys: ["food", "recipe", "pizza", "burger", "bakery", "restaurant", "dish"], t: { primary: "#e07b39", deep: "#b05a24", bg: "#fff8f1", surface: "#ffffff", text: "#33241a", muted: "#7c6553", dark: false, heading: "Georgia, serif", body: "system-ui, sans-serif" } },
  { keys: ["music", "band", "album", "concert", "playlist", "dj"], t: { primary: "#a855f7", deep: "#7e22ce", bg: "#120e17", surface: "#1b1423", text: "#f1eaf8", muted: "#9c8bb0", dark: true, heading: "Georgia, serif", body: "system-ui, sans-serif" } },
  { keys: ["travel", "trip", "tour", "hotel", "adventure", "hike"], t: { primary: "#0e8fa3", deep: "#0a6b7a", bg: "#f2f9fa", surface: "#ffffff", text: "#17323a", muted: "#5f7d85", dark: false, heading: "Georgia, serif", body: "system-ui, sans-serif" } },
  { keys: ["fashion", "clothing", "store", "boutique", "brand", "wear"], t: { primary: "#111111", deep: "#000000", bg: "#f7f5f2", surface: "#ffffff", text: "#1a1a1a", muted: "#6f6a63", dark: false, heading: "'Didot', Georgia, serif", body: "system-ui, sans-serif" } },
  { keys: ["school", "learn", "course", "study", "education", "lesson"], t: { primary: "#2563eb", deep: "#1d4fc4", bg: "#f4f7fe", surface: "#ffffff", text: "#182338", muted: "#5c6b85", dark: false, heading: "system-ui, sans-serif", body: "system-ui, sans-serif" } },
  { keys: ["nature", "garden", "plant", "eco", "flower", "farm"], t: { primary: "#4d7c0f", deep: "#3a5f0b", bg: "#f6f8ef", surface: "#ffffff", text: "#243016", muted: "#66754c", dark: false, heading: "Georgia, serif", body: "system-ui, sans-serif" } },
  { keys: ["game", "arcade", "play", "quest"], t: { primary: "#f43f5e", deep: "#be123c", bg: "#0f172a", surface: "#182238", text: "#e2e8f0", muted: "#7c8aa5", dark: true, heading: "'Arial Black', system-ui, sans-serif", body: "system-ui, sans-serif" } },
  { keys: ["photo", "portfolio", "design", "art", "studio", "gallery"], t: { primary: "#d97706", deep: "#a85c05", bg: "#141311", surface: "#1e1c18", text: "#f2eee6", muted: "#a29a8b", dark: true, heading: "'Didot', Georgia, serif", body: "system-ui, sans-serif" } },
];

const FALLBACK_T: Theme = {
  primary: "#615ced", deep: "#4b46c9", bg: "#f6f6fb", surface: "#ffffff", text: "#20212c", muted: "#63647a",
  dark: false, heading: "system-ui, sans-serif", body: "system-ui, sans-serif",
};

function deriveTheme(desc: string): Theme {
  const d = desc.toLowerCase();
  for (const t of TOPICS) if (t.keys.some((k) => d.includes(k))) return { ...FALLBACK_T, ...t.t } as Theme;
  return FALLBACK_T;
}

/* ---------------- content helpers ---------------- */

const STOP = new Set("a an the and or of for to in on with my our your me please make create build do is are be app page site website that this need want using use".split(" "));

function keywords(desc: string, n = 3): string[] {
  return desc
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ITEMS: Record<string, string[]> = {
  coffee: ["Single-origin espresso", "V60 pour-over", "Oat flat white", "Cold brew tonic", "Cinnamon roll"],
  food: ["Truffle pasta", "Wood-fired pizza", "Burrata salad", "Smoked ribs", "Basque cheesecake"],
  fashion: ["Oversized blazer", "Raw denim", "Knit polo", "Leather tote", "Silk scarf"],
  music: ["Late-night sessions", "Analog warm-up", "Vinyl only", "Open decks", "Aftermovie"],
  travel: ["Hidden coastlines", "Mountain passes", "Old town walks", "Street food tour", "Sunrise points"],
  tech: ["Realtime sync", "Offline-first", "Edge functions", "Zero-config deploys", "Typed SDK"],
  fitness: ["Strength basics", "HIIT circuit", "Mobility flow", "5K plan", "Recovery day"],
  finance: ["Index funds", "Cash-flow map", "Debt snowball", "Emergency fund", "Tax checklist"],
  education: ["Spaced repetition", "Pomodoro sprints", "Active recall", "Concept maps", "Weekly review"],
  nature: ["Seed starting", "Compost corner", "Rain barrel", "Pollinator bed", "Herb spiral"],
  game: ["Boss rush", "Speedrun mode", "Daily quest", "Loot tiers", "Co-op dungeon"],
  photo: ["Golden hour", "Street frames", "Studio light", "Film scans", "Contact sheets"],
};

function topicKey(desc: string): string {
  const d = desc.toLowerCase();
  for (const t of TOPICS) if (t.keys.some((k) => d.includes(k))) return t.keys[0];
  return "";
}

function items(desc: string, name: string): string[] {
  const k = topicKey(desc);
  const base = ITEMS[k] ?? [`${name} special`, "Signature pick", "Community favorite", "New arrival", "Classic choice"];
  return base;
}

const shell = (title: string, body: string, theme: Theme, withJs = true) =>
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${body}
${withJs ? `  <script src="app.js"></script>` : ""}
</body>
</html>
`;

const baseCss = (t: Theme) => `:root {
  --primary: ${t.primary};
  --deep: ${t.deep};
  --bg: ${t.bg};
  --surface: ${t.surface};
  --text: ${t.text};
  --muted: ${t.muted};
  --line: ${t.dark ? "#ffffff14" : "#00000012"};
  --shadow: ${t.dark ? "0 8px 30px rgb(0 0 0 / .35)" : "0 8px 30px rgb(20 20 40 / .08)"};
}
* { box-sizing: border-box; margin: 0; }
body { background: var(--bg); color: var(--text); font-family: ${t.body}; min-height: 100vh; }
h1, h2, h3, .display { font-family: ${t.heading}; }
button { font-family: inherit; cursor: pointer; }
.btn { background: var(--primary); color: ${t.dark ? "#fff" : "#fff"}; border: none; border-radius: 12px; padding: 12px 22px; font-weight: 700; font-size: 14px; transition: transform .12s, background .15s; }
.btn:hover { background: var(--deep); transform: translateY(-1px); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow); }
`;

const readme = (name: string, desc: string, kind: string) =>
  `# ${name}\n\n${kind} generated by AiDe Coder.\n\nBrief: ${desc}\n\nRun: open index.html in a browser.`;

/* ---------------- archetypes ---------------- */

export const TEMPLATES: TemplateDef[] = [
  {
    id: "todo",
    label: "Task manager",
    keywords: ["todo", "to-do", "task", "checklist", "planner", "задач"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const kw = keywords(desc);
      return {
        "index.html": shell(name, `  <main class="wrap">
    <h1>${name}</h1>
    <p class="sub">${kw.length ? "Focus: " + kw.map(cap).join(" · ") : "Your day, organized"} — data stays in localStorage</p>
    <div class="row card">
      <input id="input" placeholder="Add a task…" />
      <button id="add" class="btn">Add</button>
    </div>
    <div class="filters">
      <button class="fbtn on" data-f="all">All</button>
      <button class="fbtn" data-f="open">Open</button>
      <button class="fbtn" data-f="done">Done</button>
    </div>
    <ul id="list"></ul>
    <p id="counter" class="counter"></p>
  </main>`, t),
        "styles.css": baseCss(t) + `
.wrap { max-width: 480px; margin: 0 auto; padding: 48px 16px; }
h1 { font-size: 28px; }
.sub { color: var(--muted); font-size: 13px; margin: 6px 0 20px; }
.row { display: flex; gap: 8px; padding: 10px; }
input { flex: 1; padding: 10px 12px; border: 1px solid var(--line); background: var(--bg); color: var(--text); border-radius: 10px; font-size: 14px; outline: none; }
input:focus { border-color: var(--primary); }
.filters { display: flex; gap: 8px; margin: 16px 0; }
.fbtn { border: 1px solid var(--line); background: transparent; color: var(--muted); border-radius: 999px; padding: 6px 14px; font-size: 12.5px; }
.fbtn.on { background: var(--primary); color: #fff; border-color: var(--primary); }
ul { list-style: none; padding: 0; display: grid; gap: 8px; }
li { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
li span { cursor: pointer; flex: 1; font-size: 14px; }
li.done span { text-decoration: line-through; color: var(--muted); }
li button { border: none; background: none; color: var(--muted); font-size: 14px; }
.counter { margin-top: 14px; color: var(--muted); font-size: 12.5px; }`,
        "app.js": `var KEY = "aide-todo";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
var items = load(), filter = "all";
var list = document.getElementById("list"), input = document.getElementById("input"), counter = document.getElementById("counter");
function save() { localStorage.setItem(KEY, JSON.stringify(items)); }
function render() {
  list.innerHTML = "";
  items.forEach(function (it, i) {
    if (filter === "open" && it.done) return;
    if (filter === "done" && !it.done) return;
    var li = document.createElement("li");
    if (it.done) li.className = "done";
    var span = document.createElement("span");
    span.textContent = it.text;
    span.onclick = function () { it.done = !it.done; save(); render(); };
    var del = document.createElement("button");
    del.textContent = "\\u2715";
    del.onclick = function () { items.splice(i, 1); save(); render(); };
    li.appendChild(span); li.appendChild(del); list.appendChild(li);
  });
  var left = items.filter(function (i) { return !i.done; }).length;
  counter.textContent = left + " open \\u00b7 " + items.length + " total";
}
document.getElementById("add").onclick = function () {
  var v = input.value.trim(); if (!v) return;
  items.push({ text: v, done: false }); input.value = ""; save(); render();
};
input.addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("add").click(); });
document.querySelectorAll(".fbtn").forEach(function (b) {
  b.onclick = function () {
    filter = b.dataset.f;
    document.querySelectorAll(".fbtn").forEach(function (x) { x.classList.toggle("on", x === b); });
    render();
  };
});
render();`,
        "README.md": readme(name, desc, "Task manager with filters and localStorage persistence"),
      };
    },
  },
  {
    id: "quiz",
    label: "Quiz app",
    keywords: ["quiz", "trivia", "test your", "вікторин"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const kw = keywords(desc);
      const topic = kw[0] ? cap(kw[0]) : "General";
      return {
        "index.html": shell(name, `  <main class="wrap">
    <p class="kicker">${topic} quiz</p>
    <h1>${name}</h1>
    <div class="card stage">
      <div class="bar"><span id="bar"></span></div>
      <p id="q" class="q"></p>
      <div id="opts" class="opts"></div>
      <p id="score" class="score"></p>
      <button id="next" class="btn" style="display:none">Next</button>
    </div>
  </main>`, t),
        "styles.css": baseCss(t) + `
.wrap { max-width: 520px; margin: 0 auto; padding: 48px 16px; }
.kicker { color: var(--primary); font-weight: 700; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
h1 { font-size: 28px; margin: 6px 0 20px; }
.stage { padding: 24px; }
.bar { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; margin-bottom: 18px; }
.bar span { display: block; height: 100%; width: 0; background: var(--primary); transition: width .3s; }
.q { font-size: 18px; font-weight: 700; margin-bottom: 16px; line-height: 1.4; }
.opts { display: grid; gap: 8px; }
.opt { text-align: left; padding: 13px 15px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font-size: 14px; transition: border-color .12s, background .12s; }
.opt:hover { border-color: var(--primary); }
.opt.right { border-color: #16a34a; background: #16a34a22; }
.opt.wrong { border-color: #dc2626; background: #dc262622; }
.score { margin: 14px 0; color: var(--muted); font-size: 13px; }`,
        "app.js": `var QUESTIONS = [
  { q: "Which of these best describes ${topic.toLowerCase()}?", a: ["It keeps evolving", "It never changes", "Nobody knows", "It is obsolete"], c: 0 },
  { q: "A beginner in ${topic.toLowerCase()} should start with…", a: ["Basics and practice", "Advanced tricks", "Buying gear", "Memorizing theory"], c: 0 },
  { q: "The fastest way to improve at ${topic.toLowerCase()}?", a: ["Regular short sessions", "One yearly marathon", "Watching others", "Avoiding mistakes"], c: 0 },
  { q: "What matters most in ${topic.toLowerCase()}?", a: ["Consistency", "Luck", "Talent only", "Expensive tools"], c: 0 },
  { q: "${topic} + community = ?", a: ["Faster growth", "Slower growth", "No effect", "Chaos"], c: 0 }
];
var i = 0, score = 0;
var q = document.getElementById("q"), opts = document.getElementById("opts"),
    bar = document.getElementById("bar"), scoreEl = document.getElementById("score"),
    next = document.getElementById("next");
function render() {
  var item = QUESTIONS[i];
  bar.style.width = (i / QUESTIONS.length * 100) + "%";
  q.textContent = (i + 1) + ". " + item.q;
  opts.innerHTML = ""; next.style.display = "none";
  scoreEl.textContent = "Score: " + score + " / " + QUESTIONS.length;
  item.a.forEach(function (txt, k) {
    var b = document.createElement("button");
    b.className = "opt"; b.textContent = txt;
    b.onclick = function () {
      Array.from(opts.children).forEach(function (c) { c.disabled = true; });
      if (k === item.c) { b.classList.add("right"); score++; }
      else { b.classList.add("wrong"); opts.children[item.c].classList.add("right"); }
      scoreEl.textContent = "Score: " + score + " / " + QUESTIONS.length;
      next.style.display = "inline-block";
      next.textContent = i === QUESTIONS.length - 1 ? "Finish" : "Next";
    };
    opts.appendChild(b);
  });
}
next.onclick = function () {
  i++;
  if (i >= QUESTIONS.length) {
    q.textContent = "Done! You scored " + score + " of " + QUESTIONS.length;
    opts.innerHTML = ""; next.style.display = "none";
    bar.style.width = "100%";
    scoreEl.textContent = score === QUESTIONS.length ? "Perfect \\u2728" : "Play again to beat it.";
    next.style.display = "inline-block"; next.textContent = "Restart";
    next.onclick = function () { i = 0; score = 0; next.onclick = arguments.callee; render(); };
    return;
  }
  render();
};
render();`,
        "README.md": readme(name, desc, "Interactive quiz with scoring and progress bar"),
      };
    },
  },
  {
    id: "calculator",
    label: "Calculator",
    keywords: ["calculator", "calc", "math", "конвертер", "converter"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      return {
        "index.html": shell(name, `  <main class="wrap">
    <h1>${name}</h1>
    <div class="card calc">
      <div id="screen" class="screen">0</div>
      <div class="keys">
        ${["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "⌫", "="]
          .map((k) => `<button class="k${["÷", "×", "−", "+", "="].includes(k) ? " op" : ""}${k === "C" ? " warn" : ""}">${k}</button>`)
          .join("\n        ")}
      </div>
    </div>
  </main>`, t),
        "styles.css": baseCss(t) + `
.wrap { max-width: 340px; margin: 0 auto; padding: 48px 16px; }
h1 { font-size: 24px; margin-bottom: 18px; text-align: center; }
.calc { padding: 16px; }
.screen { text-align: right; font-size: 38px; font-variant-numeric: tabular-nums; padding: 18px 12px; overflow: hidden; white-space: nowrap; }
.keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
.k { padding: 16px 0; font-size: 17px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); color: var(--text); transition: background .1s; }
.k:active { background: var(--line); }
.k.op { background: var(--primary); border-color: var(--primary); color: #fff; }
.k.warn { color: #dc2626; }`,
        "app.js": `var screen = document.getElementById("screen");
var cur = "0", acc = null, op = null, fresh = true;
function fmt(n) { var s = String(+n.toPrecision(12)); return s.length > 12 ? n.toExponential(6) : s; }
function show() { screen.textContent = cur; }
function apply(a, b, o) {
  a = parseFloat(a); b = parseFloat(b);
  return o === "+" ? a + b : o === "\\u2212" ? a - b : o === "\\u00d7" ? a * b : b === 0 ? NaN : a / b;
}
document.querySelectorAll(".k").forEach(function (k) {
  k.onclick = function () {
    var v = k.textContent;
    if (v >= "0" && v <= "9") { cur = fresh || cur === "0" ? v : cur + v; fresh = false; }
    else if (v === ".") { if (fresh) { cur = "0."; fresh = false; } else if (!cur.includes(".")) cur += "."; }
    else if (v === "C") { cur = "0"; acc = null; op = null; fresh = true; }
    else if (v === "\\u00b1") cur = cur.startsWith("-") ? cur.slice(1) : cur === "0" ? "0" : "-" + cur;
    else if (v === "%") cur = fmt(parseFloat(cur) / 100);
    else if (v === "\\u232b") { cur = cur.length > 1 ? cur.slice(0, -1) : "0"; }
    else if (v === "=") { if (op !== null && acc !== null) { cur = fmt(apply(acc, cur, op)); acc = null; op = null; fresh = true; } }
    else { if (op && acc !== null && !fresh) cur = fmt(apply(acc, cur, op)); acc = cur; op = v; fresh = true; }
    show();
  };
});
show();`,
        "README.md": readme(name, desc, "A full four-function calculator"),
      };
    },
  },
  {
    id: "timer",
    label: "Focus timer",
    keywords: ["pomodoro", "timer", "focus", "countdown", "таймер"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const kw = keywords(desc);
      return {
        "index.html": shell(name, `  <main class="wrap">
    <h1>${name}</h1>
    <p class="sub">${kw.length ? cap(kw[0]) + " sessions" : "Deep work"}, one interval at a time</p>
    <div class="modes">
      <button id="m-focus" class="mode on">Focus 25</button>
      <button id="m-short" class="mode">Break 5</button>
      <button id="m-long" class="mode">Long 15</button>
    </div>
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--line)" stroke-width="8"/>
        <circle id="ring" cx="60" cy="60" r="54" fill="none" stroke="var(--primary)" stroke-width="8"
                stroke-linecap="round" transform="rotate(-90 60 60)"/>
      </svg>
      <span id="time">25:00</span>
    </div>
    <div class="ctrl">
      <button id="toggle" class="btn">Start</button>
      <button id="reset" class="ghost">Reset</button>
    </div>
  </main>`, t),
        "styles.css": baseCss(t) + `
.wrap { max-width: 380px; margin: 0 auto; padding: 48px 16px; text-align: center; }
h1 { font-size: 26px; }
.sub { color: var(--muted); font-size: 13px; margin: 6px 0 22px; }
.modes { display: flex; gap: 8px; justify-content: center; margin-bottom: 26px; }
.mode { border: 1px solid var(--line); background: transparent; color: var(--muted); border-radius: 999px; padding: 8px 16px; font-size: 13px; }
.mode.on { background: var(--primary); border-color: var(--primary); color: #fff; }
.ring-wrap { position: relative; width: 240px; margin: 0 auto 26px; }
.ring-wrap svg { width: 100%; }
#time { position: absolute; inset: 0; display: grid; place-items: center; font-size: 44px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ctrl { display: flex; gap: 10px; justify-content: center; }
.ghost { background: none; border: 1px solid var(--line); border-radius: 12px; padding: 12px 20px; color: var(--muted); }`,
        "app.js": `var MODES = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
var mode = "focus", left = MODES.focus, tick = null;
var timeEl = document.getElementById("time"), ring = document.getElementById("ring");
var C = 2 * Math.PI * 54;
ring.style.strokeDasharray = C;
function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
function render() {
  timeEl.textContent = fmt(left);
  ring.style.strokeDashoffset = C * (1 - left / MODES[mode]);
  document.title = fmt(left) + " \\u2014 ${name}";
}
function stop() { clearInterval(tick); tick = null; document.getElementById("toggle").textContent = "Start"; }
document.getElementById("toggle").onclick = function () {
  if (tick) { stop(); return; }
  this.textContent = "Pause";
  tick = setInterval(function () {
    left--;
    if (left <= 0) { left = 0; render(); stop(); alert("Time is up!"); left = MODES[mode]; render(); return; }
    render();
  }, 1000);
};
document.getElementById("reset").onclick = function () { stop(); left = MODES[mode]; render(); };
["focus", "short", "long"].forEach(function (m) {
  document.getElementById("m-" + m).onclick = function () {
    stop(); mode = m; left = MODES[m];
    document.querySelectorAll(".mode").forEach(function (b) { b.classList.remove("on"); });
    this.classList.add("on"); render();
  };
});
render();`,
        "README.md": readme(name, desc, "Pomodoro-style timer with an SVG progress ring"),
      };
    },
  },
  {
    id: "snake",
    label: "Arcade game",
    keywords: ["snake", "game", "arcade", "гра"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      return {
        "index.html": shell(name, `  <main class="game-wrap">
    <h1>${name}</h1>
    <p class="sub">Arrows / WASD to steer</p>
    <div class="board">
      <canvas id="game" width="400" height="400"></canvas>
      <button id="restart" style="display:none">Play again</button>
    </div>
    <p>Score: <strong id="score">0</strong></p>
  </main>`, t),
        "styles.css": baseCss(t) + `
.game-wrap { text-align: center; padding: 24px; }
h1 { font-size: 24px; }
.sub { color: var(--muted); font-size: 13px; margin: 6px 0 18px; }
.board { position: relative; display: inline-block; }
canvas { border-radius: 14px; border: 1px solid var(--line); display: block; max-width: 90vw; background: var(--surface); }
#restart { position: absolute; left: 50%; top: 58%; transform: translate(-50%, -50%); background: var(--primary); color: #fff; border: none; padding: 12px 22px; border-radius: 12px; font-weight: 700; }
strong { color: var(--primary); font-size: 18px; }`,
        "app.js": `var cv = document.getElementById("game"), ctx = cv.getContext("2d");
var CELL = 20, N = 20, snake, dir, food, score, timer, speed;
var P = "${t.primary}";
function place() {
  do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
  while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
}
function start() { clearInterval(timer); timer = setInterval(step, speed); }
function reset() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }]; dir = { x: 1, y: 0 };
  score = 0; speed = 130;
  document.getElementById("score").textContent = "0";
  place(); draw(); start();
}
function step() {
  var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(function (s) { return s.x === h.x && s.y === h.y; })) { gameOver(); return; }
  snake.unshift(h);
  if (h.x === food.x && h.y === food.y) {
    score++; document.getElementById("score").textContent = score; place();
    if (speed > 60) { speed -= 3; start(); }
  } else snake.pop();
  draw();
}
function draw() {
  ctx.fillStyle = "${t.surface}"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = P;
  snake.forEach(function (s) { ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2); });
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
}
function gameOver() {
  clearInterval(timer);
  ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#fff"; ctx.font = "bold 22px system-ui"; ctx.textAlign = "center";
  ctx.fillText("Score: " + score, cv.width / 2, cv.height / 2);
  document.getElementById("restart").style.display = "inline-block";
}
document.addEventListener("keydown", function (e) {
  var k = e.key.toLowerCase();
  if ((k === "arrowup" || k === "w") && dir.y === 0) dir = { x: 0, y: -1 };
  if ((k === "arrowdown" || k === "s") && dir.y === 0) dir = { x: 0, y: 1 };
  if ((k === "arrowleft" || k === "a") && dir.x === 0) dir = { x: -1, y: 0 };
  if ((k === "arrowright" || k === "d") && dir.x === 0) dir = { x: 1, y: 0 };
});
document.getElementById("restart").onclick = function () { this.style.display = "none"; reset(); };
reset();`,
        "README.md": readme(name, desc, "Canvas Snake that speeds up as you score"),
      };
    },
  },
  {
    id: "notes",
    label: "Notes app",
    keywords: ["notes", "notebook", "markdown", "diary", "journal", "нотат"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      return {
        "index.html": shell(name, `  <main class="notes">
    <aside>
      <button id="new" class="btn">+ New note</button>
      <ul id="list"></ul>
    </aside>
    <section>
      <input id="title" placeholder="Title…" />
      <textarea id="body" placeholder="Write… supports **bold**, *italic*, \`code\`"></textarea>
      <div id="preview" class="preview card"></div>
    </section>
  </main>`, t),
        "styles.css": baseCss(t) + `
.notes { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
aside { background: var(--surface); border-right: 1px solid var(--line); padding: 16px; overflow-y: auto; }
#new { width: 100%; margin-bottom: 14px; }
#list { list-style: none; padding: 0; display: grid; gap: 6px; }
#list li { padding: 10px 12px; border-radius: 10px; cursor: pointer; font-size: 13.5px; color: var(--muted); }
#list li:hover { background: var(--line); }
#list li.on { background: ${t.primary}22; color: var(--primary); font-weight: 700; }
section { padding: 22px; display: grid; grid-template-rows: auto 1fr 1fr; gap: 12px; overflow: hidden; }
#title { border: none; background: none; color: var(--text); font-size: 22px; font-weight: 700; outline: none; }
textarea, .preview { border: 1px solid var(--line); border-radius: 14px; background: var(--surface); color: var(--text); padding: 16px; font-size: 14px; line-height: 1.65; overflow-y: auto; }
textarea { resize: none; outline: none; font-family: ui-monospace, monospace; font-size: 13px; }
.preview code { background: var(--line); padding: 1px 5px; border-radius: 4px; }`,
        "app.js": `var KEY = "aide-notes";
function loadNotes() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
var notes = loadNotes(), active = 0;
var listEl = document.getElementById("list"), titleEl = document.getElementById("title"),
    bodyEl = document.getElementById("body"), prevEl = document.getElementById("preview");
function save() { localStorage.setItem(KEY, JSON.stringify(notes)); }
function md(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
    .replace(/\\*([^*]+)\\*/g, "<em>$1</em>")
    .replace(/\\\`([^\\\`]+)\\\`/g, "<code>$1</code>")
    .replace(/\\n/g, "<br/>");
}
function render() {
  listEl.innerHTML = "";
  notes.forEach(function (n, i) {
    var li = document.createElement("li");
    li.textContent = n.title || "Untitled";
    if (i === active) li.className = "on";
    li.onclick = function () { active = i; render(); };
    listEl.appendChild(li);
  });
  var n = notes[active];
  titleEl.value = n ? n.title : "";
  bodyEl.value = n ? n.body : "";
  prevEl.innerHTML = n ? md(n.body) : "";
}
document.getElementById("new").onclick = function () { notes.unshift({ title: "", body: "" }); active = 0; save(); render(); titleEl.focus(); };
titleEl.oninput = function () { notes[active].title = this.value; save(); render(); };
bodyEl.oninput = function () { notes[active].body = this.value; save(); prevEl.innerHTML = md(this.value); };
if (!notes.length) notes.push({ title: "Hi!", body: "Your first note. Write **markdown** here." });
save(); render();`,
        "README.md": readme(name, desc, "Notes with autosave and live markdown preview"),
      };
    },
  },
  {
    id: "dashboard",
    label: "Dashboard",
    keywords: ["dashboard", "analytics", "metrics", "stats", "kpi", "chart"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const kw = keywords(desc);
      return {
        "index.html": shell(name, `  <main class="dash">
    <h1>${name}</h1>
    <p class="sub">${kw.length ? cap(kw.join(" · ")) + " — " : ""}live overview</p>
    <div class="stats">
      <div class="stat card"><span>Visitors</span><strong>12,480</strong><em>+8.2%</em></div>
      <div class="stat card"><span>Conversions</span><strong>1,243</strong><em>+3.1%</em></div>
      <div class="stat card"><span>Rate</span><strong>4.7%</strong><em class="down">\\u22120.4%</em></div>
      <div class="stat card"><span>Average</span><strong>$38.2</strong><em>+$0.6</em></div>
    </div>
    <div class="chart-card card">
      <div class="chart-head"><h2>Trend</h2>
        <div><button id="p-week" class="pbtn on">Week</button><button id="p-month" class="pbtn">Month</button></div>
      </div>
      <svg id="chart" viewBox="0 0 480 160" preserveAspectRatio="none">
        <polyline points="" fill="none" stroke="${t.primary}" stroke-width="2.5" stroke-linejoin="round"/>
        ${[0, 1, 2, 3, 4, 5, 6].map(() => `<circle r="4" fill="${t.primary}"/>`).join("\n        ")}
      </svg>
    </div>
  </main>`, t),
        "styles.css": baseCss(t) + `
.dash { padding: 32px 5vw; max-width: 960px; margin: 0 auto; }
h1 { font-size: 24px; }
.sub { color: var(--muted); font-size: 13px; margin: 4px 0 20px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 18px; }
.stat { padding: 18px; }
.stat span { color: var(--muted); font-size: 12.5px; }
.stat strong { display: block; font-size: 24px; margin: 6px 0 4px; }
.stat em { font-style: normal; color: #16a34a; font-size: 12.5px; font-weight: 700; }
.stat em.down { color: #dc2626; }
.chart-card { padding: 22px; }
.chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.chart-head h2 { font-size: 16px; }
.pbtn { border: 1px solid var(--line); background: transparent; border-radius: 8px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; margin-left: 6px; color: var(--muted); }
.pbtn.on { background: var(--primary); border-color: var(--primary); color: #fff; }
svg { width: 100%; height: 180px; }`,
        "app.js": `var DATA = { week: [12, 18, 14, 22, 28, 24, 31], month: [120, 180, 150, 220, 280, 240, 310] };
function draw(key) {
  var vals = DATA[key], svg = document.getElementById("chart");
  var max = Math.max.apply(null, vals);
  var pts = vals.map(function (v, i) {
    return Math.round(i * (480 / (vals.length - 1))) + "," + Math.round(150 - (v / max) * 130);
  });
  svg.querySelector("polyline").setAttribute("points", pts.join(" "));
  var circles = svg.querySelectorAll("circle");
  pts.forEach(function (p, i) { var xy = p.split(","); circles[i].setAttribute("cx", xy[0]); circles[i].setAttribute("cy", xy[1]); });
}
function setP(btn, key) {
  document.querySelectorAll(".pbtn").forEach(function (b) { b.classList.remove("on"); });
  btn.classList.add("on"); draw(key);
}
document.getElementById("p-week").onclick = function () { setP(this, "week"); };
document.getElementById("p-month").onclick = function () { setP(this, "month"); };
draw("week");`,
        "README.md": readme(name, desc, "KPI dashboard with an interactive SVG chart"),
      };
    },
  },
  {
    id: "shop",
    label: "Shop / catalog",
    keywords: ["shop", "store", "catalog", "products", "market", "магазин", "товар"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const list = items(desc, name);
      const prices = [12, 19, 9, 24, 15];
      return {
        "index.html": shell(name, `  <header class="top">
    <span class="logo">${name}</span>
    <span class="cart">Cart: <strong id="count">0</strong></span>
  </header>
  <main class="wrap">
    <p class="kicker">Catalog</p>
    <h1>${name}</h1>
    <p class="lead">${keywords(desc).slice(0, 2).map(cap).join(" · ") || "Curated picks"} — add anything to the cart.</p>
    <div id="grid" class="grid"></div>
  </main>`, t),
        "styles.css": baseCss(t) + `
.top { display: flex; justify-content: space-between; padding: 18px 5vw; border-bottom: 1px solid var(--line); }
.logo { font-weight: 800; letter-spacing: .02em; }
.cart { color: var(--muted); font-size: 14px; }
.cart strong { color: var(--primary); }
.wrap { max-width: 900px; margin: 0 auto; padding: 40px 5vw; }
.kicker { color: var(--primary); font-weight: 700; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
h1 { font-size: 34px; margin: 8px 0 10px; }
.lead { color: var(--muted); margin-bottom: 26px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
.prod { padding: 18px; display: flex; flex-direction: column; gap: 8px; }
.prod .thumb { height: 90px; border-radius: 10px; background: linear-gradient(135deg, ${t.primary}33, ${t.primary}11); display: grid; place-items: center; font-size: 30px; }
.prod h3 { font-size: 14.5px; }
.prod .row2 { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.price { font-weight: 800; color: var(--primary); }
.add { border: 1px solid var(--primary); color: var(--primary); background: none; border-radius: 8px; padding: 6px 12px; font-size: 12.5px; font-weight: 700; }
.add:hover { background: var(--primary); color: #fff; }`,
        "app.js": `var PRODUCTS = ${JSON.stringify(list.map((n, i) => ({ n, p: prices[i % prices.length], e: ["◆", "●", "▲", "✦", "■"][i % 5] })))};
var count = 0;
var grid = document.getElementById("grid");
PRODUCTS.forEach(function (p) {
  var d = document.createElement("div");
  d.className = "prod card";
  d.innerHTML = '<div class="thumb">' + p.e + "</div><h3>" + p.n + '</h3><div class="row2"><span class="price">$' + p.p + '</span><button class="add">Add</button></div>';
  d.querySelector(".add").onclick = function () {
    count++; document.getElementById("count").textContent = count;
    this.textContent = "Added \\u2713"; var b = this;
    setTimeout(function () { b.textContent = "Add"; }, 900);
  };
  grid.appendChild(d);
});`,
        "README.md": readme(name, desc, "Product grid with a working mini-cart"),
      };
    },
  },
  {
    id: "menu",
    label: "Menu / restaurant",
    keywords: ["menu", "restaurant", "cafe", "coffee", "bar", "pizza", "кафе", "ресторан"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const list = items(desc, name);
      const prices = ["4.5", "5.0", "3.8", "6.2", "4.0"];
      return {
        "index.html": shell(name, `  <header>
    <span class="logo">◈ ${name}</span>
    <nav><a href="#menu">Menu</a><a href="#about">About</a><a href="#hours">Hours</a></nav>
  </header>
  <section class="hero">
    <p class="eyebrow">${keywords(desc).slice(0, 2).map(cap).join(" · ") || "Fresh every day"}</p>
    <h1>${name}</h1>
    <p class="lead">Small place, big obsession. Menu below — everything made in-house.</p>
    <a class="btn cta" href="#menu">See the menu</a>
  </section>
  <section id="menu" class="cards">
    ${list.map((n, i) => `<div class="card dish"><h3>${n}</h3><span>$${prices[i % prices.length]}</span></div>`).join("\n    ")}
  </section>
  <section id="about" class="about">
    <h2>Why ${name}</h2>
    <p>We sweat the details others skip. Seasonal ingredients, honest portions, and a team that remembers your order.</p>
  </section>
  <section id="hours" class="hours">
    <h2>Hours</h2>
    <p>Mon–Fri: 8:00 – 21:00<br/>Sat–Sun: 9:00 – 22:00</p>
  </section>
  <footer>© <span id="year"></span> ${name} · built with AiDe Coder</footer>`, t),
        "styles.css": baseCss(t) + `
header { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; }
.logo { font-weight: 800; }
nav a { margin-left: 22px; color: var(--muted); text-decoration: none; font-size: 14px; }
nav a:hover { color: var(--text); }
.hero { padding: 11vh 6vw 9vh; max-width: 720px; }
.eyebrow { color: var(--primary); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 16px; font-weight: 700; }
.hero h1 { font-size: clamp(38px, 6vw, 62px); line-height: 1.05; }
.lead { margin: 20px 0 28px; color: var(--muted); max-width: 460px; line-height: 1.6; }
.cta { display: inline-block; text-decoration: none; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; padding: 0 6vw 7vh; max-width: 1000px; }
.dish { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
.dish h3 { font-size: 15px; }
.dish span { color: var(--primary); font-weight: 800; }
.about, .hours { padding: 5vh 6vw; max-width: 640px; }
.about h2, .hours h2 { margin-bottom: 12px; }
.about p, .hours p { color: var(--muted); line-height: 1.7; }
footer { padding: 26px 6vw; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); }`,
        "app.js": `document.getElementById("year").textContent = new Date().getFullYear();`,
        "README.md": readme(name, desc, "Restaurant/menu landing with navigation"),
      };
    },
  },
  {
    id: "blog",
    label: "Blog / articles",
    keywords: ["blog", "article", "post", "writer", "блог", "статт"],
    build: (name, desc) => {
      const t = deriveTheme(desc);
      const kw = keywords(desc);
      const topic = kw[0] ? cap(kw[0]) : "Ideas";
      return {
        "index.html": shell(name, `  <header class="top">
    <span class="logo">${name}</span>
    <span class="tag">${topic}</span>
  </header>
  <main class="wrap">
    <h1>Notes on ${topic.toLowerCase()}</h1>
    <p class="lead">Short, honest essays. No fluff.</p>
    <article class="card post">
      <time>Feb 2026</time>
      <h2>Start smaller than feels comfortable</h2>
      <p>The best ${topic.toLowerCase()} work I've seen began as a ten-minute sketch. Momentum beats scope: ship the sketch, let feedback redraw the borders…</p>
      <a class="more" href="#">Read →</a>
    </article>
    <article class="card post">
      <time>Jan 2026</time>
      <h2>Constraints are a feature</h2>
      <p>Limit the palette, the stack, the word count. Every constraint removes a decision, and every removed decision frees attention for the work that matters…</p>
      <a class="more" href="#">Read →</a>
    </article>
    <article class="card post">
      <time>Dec 2025</time>
      <h2>Show the seams</h2>
      <p>Polish can become a hiding place. The drafts with visible seams get better replies — people trust the process more than the pedestal…</p>
      <a class="more" href="#">Read →</a>
    </article>
  </main>
  <footer>© ${name}</footer>`, t),
        "styles.css": baseCss(t) + `
.top { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; border-bottom: 1px solid var(--line); }
.logo { font-weight: 800; }
.tag { font-size: 12px; font-weight: 700; color: var(--primary); border: 1px solid ${t.primary}55; padding: 4px 12px; border-radius: 999px; }
.wrap { max-width: 640px; margin: 0 auto; padding: 44px 20px 60px; }
h1 { font-size: 30px; }
.lead { color: var(--muted); margin: 8px 0 28px; }
.post { padding: 24px; margin-bottom: 16px; }
.post time { font-size: 12px; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }
.post h2 { font-size: 19px; margin: 8px 0; }
.post p { color: var(--muted); line-height: 1.65; font-size: 14.5px; }
.more { display: inline-block; margin-top: 12px; color: var(--primary); font-weight: 700; text-decoration: none; }
footer { padding: 26px 6vw; color: var(--muted); font-size: 13px; }`,
        "app.js": `/* static blog — replace posts with your own */`,
        "README.md": readme(name, desc, "A minimal blog layout with article cards"),
      };
    },
  },
];

/* ---------------- landing (default, fully derived from the brief) ---------------- */

export const GENERIC: TemplateDef = {
  id: "landing",
  label: "Landing page",
  keywords: [],
  build: (name, desc) => {
    const t = deriveTheme(desc);
    const kw = keywords(desc);
    const topic = kw[0] ? cap(kw[0]) : "the idea";
    const list = items(desc, name);
    return {
      "index.html": shell(name, `  <header>
    <span class="logo">◈ ${name}</span>
    <nav><a href="#features">Highlights</a><a href="#about">About</a><a class="btn small" href="#cta">Get started</a></nav>
  </header>
  <section class="hero">
    <p class="eyebrow">${kw.slice(0, 2).map(cap).join(" · ") || "Built for you"}</p>
    <h1>${name} — ${topic.toLowerCase()}, done right</h1>
    <p class="lead">A focused page for ${topic.toLowerCase()}: clear offer, no noise, one action that matters.</p>
    <div class="cta-row">
      <a class="btn" href="#cta">Try it now</a>
      <a class="ghost" href="#features">Learn more</a>
    </div>
  </section>
  <section id="features" class="cards">
    ${list.slice(0, 3).map((n, i) => `<div class="card feat"><span class="num">0${i + 1}</span><h3>${n}</h3><p>Why ${name} does it better — short, specific, and honest about trade-offs.</p></div>`).join("\n    ")}
  </section>
  <section id="about" class="about">
    <h2>Why ${name}</h2>
    <p>${desc.length > 12 ? desc.charAt(0).toUpperCase() + desc.slice(1) : "Because " + topic.toLowerCase() + " deserves a clean home."} — that brief became this page's structure, colors and copy.</p>
  </section>
  <section id="cta" class="cta card">
    <h2>Ready when you are</h2>
    <p>Join the list — one email, no spam.</p>
    <form onsubmit="return join(event)">
      <input id="email" type="email" required placeholder="you@example.com" />
      <button class="btn" type="submit">Join</button>
    </form>
    <p id="done" class="done"></p>
  </section>
  <footer>© <span id="year"></span> ${name} · generated by AiDe Coder</footer>`, t),
      "styles.css": baseCss(t) + `
header { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; }
.logo { font-weight: 800; }
nav a { margin-left: 20px; color: var(--muted); text-decoration: none; font-size: 14px; }
nav a:hover { color: var(--text); }
.btn.small { padding: 8px 16px; font-size: 13px; color: #fff; }
.hero { padding: 11vh 6vw 9vh; max-width: 780px; }
.eyebrow { color: var(--primary); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; margin-bottom: 16px; }
.hero h1 { font-size: clamp(34px, 5.5vw, 58px); line-height: 1.08; }
.lead { margin: 20px 0 30px; color: var(--muted); max-width: 520px; line-height: 1.65; font-size: 16px; }
.cta-row { display: flex; gap: 12px; align-items: center; }
.ghost { color: var(--muted); text-decoration: none; font-weight: 700; }
.ghost:hover { color: var(--text); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0 6vw 8vh; max-width: 1080px; }
.feat { padding: 26px; }
.feat .num { font-family: ui-monospace, monospace; color: var(--primary); font-size: 12px; letter-spacing: .1em; }
.feat h3 { margin: 10px 0 8px; font-size: 17px; }
.feat p { color: var(--muted); font-size: 14px; line-height: 1.6; }
.about { padding: 6vh 6vw; max-width: 680px; }
.about h2 { margin-bottom: 14px; }
.about p { color: var(--muted); line-height: 1.7; }
.cta { max-width: 560px; margin: 0 6vw 9vh; padding: 34px; }
.cta h2 { margin-bottom: 8px; }
.cta p { color: var(--muted); margin-bottom: 18px; }
.cta form { display: flex; gap: 10px; }
.cta input { flex: 1; padding: 12px 14px; border: 1px solid var(--line); background: var(--bg); color: var(--text); border-radius: 12px; font-size: 14px; outline: none; }
.cta input:focus { border-color: var(--primary); }
.done { color: #16a34a; font-weight: 700; margin: 12px 0 0; }
footer { padding: 26px 6vw; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); }`,
      "app.js": `function join(e) {
  e.preventDefault();
  document.getElementById("done").textContent = "You're on the list \\u2713";
  e.target.reset();
  return false;
}
document.getElementById("year").textContent = new Date().getFullYear();`,
      "README.md": readme(name, desc, "Landing page derived from the brief"),
    };
  },
};

/* ---------------- lookup ---------------- */

export function pickTemplate(desc: string): TemplateDef {
  const d = desc.toLowerCase();
  return TEMPLATES.find((t) => t.keywords.some((k) => d.includes(k))) ?? GENERIC;
}

export function deriveName(desc: string, tplId: string): string {
  const defaults: Record<string, string> = {
    todo: "My Tasks", quiz: "Quiz Time", calculator: "Calc", timer: "Focus Timer",
    snake: "Snake", notes: "Notes", dashboard: "Analytics", shop: "The Shop",
    menu: "Grain", blog: "The Journal", landing: "My Page",
  };
  const m = /["«”]([^"»”]+)["»”]/.exec(desc);
  if (m) return m[1];
  const kw = keywords(desc, 1)[0];
  const capKw = kw ? cap(kw) : null;
  return (tplId !== "landing" && capKw && capKw.length <= 14 ? capKw + " " + (defaults[tplId] ?? "") : null)?.trim() ?? defaults[tplId] ?? "My App";
}
