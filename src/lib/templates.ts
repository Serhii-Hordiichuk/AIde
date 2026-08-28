/* Project templates that AiDe Coder "generates from scratch".
   Each template is a fully working mini-app (index.html + styles.css + app.js). */

export interface TemplateDef {
  id: string;
  label: string;
  keywords: string[];
  build: (name: string, desc: string) => Record<string, string>;
}

const shell = (title: string, body: string, withJs = true) =>
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

export const TEMPLATES: TemplateDef[] = [
  {
    id: "todo",
    label: "To-Do app",
    keywords: ["todo", "to-do", "task", "checklist", "planner"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <main class="app">
    <h1>${name}</h1>
    <p class="sub">Built by AiDe Coder — data lives in localStorage</p>
    <div class="row">
      <input id="input" placeholder="New task…" />
      <button id="add">Add</button>
    </div>
    <ul id="list"></ul>
    <p id="counter" class="counter"></p>
  </main>`
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #f1f5f9; min-height: 100vh; display: grid; place-items: start center; padding: 48px 16px; }
.app { width: 100%; max-width: 460px; background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgb(15 23 42 / .08); }
h1 { font-size: 22px; }
.sub { color: #64748b; font-size: 13px; margin: 6px 0 18px; }
.row { display: flex; gap: 8px; }
input { flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
input:focus { border-color: #0f9d8f; }
#add { padding: 10px 18px; background: #0f9d8f; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
#add:hover { background: #0c8377; }
ul { list-style: none; padding: 0; margin-top: 16px; display: grid; gap: 8px; }
li { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; }
li span { cursor: pointer; flex: 1; }
li.done span { text-decoration: line-through; color: #94a3b8; }
li button { border: none; background: none; color: #cbd5e1; font-size: 15px; cursor: pointer; }
li button:hover { color: #ef4444; }
.counter { margin-top: 14px; color: #64748b; font-size: 12.5px; }`,
      "app.js": `var KEY = "aide-todo-items";
function loadItems() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
var items = loadItems();
var list = document.getElementById("list");
var input = document.getElementById("input");
var counter = document.getElementById("counter");
function save() { localStorage.setItem(KEY, JSON.stringify(items)); }
function render() {
  list.innerHTML = "";
  items.forEach(function (it, i) {
    var li = document.createElement("li");
    if (it.done) li.className = "done";
    var span = document.createElement("span");
    span.textContent = it.text;
    span.onclick = function () { it.done = !it.done; save(); render(); };
    var del = document.createElement("button");
    del.textContent = "\\u2715";
    del.onclick = function () { items.splice(i, 1); save(); render(); };
    li.appendChild(span); li.appendChild(del);
    list.appendChild(li);
  });
  var left = items.filter(function (i) { return !i.done; }).length;
  counter.textContent = left + " open \\u00b7 " + items.length + " total";
}
document.getElementById("add").onclick = function () {
  var t = input.value.trim();
  if (!t) return;
  items.push({ text: t, done: false });
  input.value = ""; save(); render();
};
input.addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("add").click(); });
render();`,
      "README.md": `# ${name}\n\nA minimal dependency-free To-Do app.\n\n- Add tasks: input + Enter\n- Click a task to toggle done\n- ✕ to delete\n- State persists in localStorage\n\nRun: just open index.html.`,
    }),
  },
  {
    id: "landing",
    label: "Coffee shop landing",
    keywords: ["landing", "coffee", "cafe", "café", "promo", "business site", "shop"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <header>
    <span class="logo">◈ ${name}</span>
    <nav><a href="#menu">Menu</a><a href="#about">About</a><a href="#hours">Hours</a></nav>
  </header>
  <section class="hero">
    <p class="eyebrow">Freshly roasted beans, every week</p>
    <h1>Coffee that<br/><em>wakes up</em> with you</h1>
    <p class="lead">Alternative brews, in-house pastries from 7:30 in the morning.</p>
    <a class="cta" href="#menu">See the menu</a>
  </section>
  <section id="menu" class="cards">
    <div class="card"><h3>Espresso Tonic</h3><p>Double shot, tonic, ice and a twist of lemon.</p><span>$4.5</span></div>
    <div class="card"><h3>V60 Pour-over</h3><p>Ethiopia Yirgacheffe: berries, bergamot, florals.</p><span>$5.0</span></div>
    <div class="card"><h3>Matcha Latte</h3><p>Ceremonial matcha on oat milk.</p><span>$5.5</span></div>
  </section>
  <section id="about" class="about">
    <h2>A small café with a big obsession</h2>
    <p>We roast our own beans, weigh every shot and remember our regulars' orders. No pretence — just good coffee.</p>
  </section>
  <section id="hours" class="hours">
    <h2>Hours</h2>
    <p>Mon–Fri: 7:30 – 20:00<br/>Sat–Sun: 9:00 – 21:00</p>
  </section>
  <footer>© <span id="year"></span> ${name} · Made with AiDe Coder</footer>`,
        false
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: Georgia, 'Times New Roman', serif; }
body { background: #faf6f0; color: #2b2118; }
header { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; }
.logo { font-weight: 700; letter-spacing: .02em; }
nav a { margin-left: 22px; color: #6b5847; text-decoration: none; font-size: 14px; }
nav a:hover { color: #2b2118; }
.hero { padding: 12vh 6vw 10vh; }
.eyebrow { color: #a4552f; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 18px; }
.hero h1 { font-size: clamp(38px, 6vw, 64px); line-height: 1.08; font-weight: 400; }
.hero h1 em { color: #a4552f; }
.lead { margin: 22px 0 30px; color: #6b5847; max-width: 460px; line-height: 1.6; }
.cta { display: inline-block; background: #2b2118; color: #faf6f0; padding: 13px 26px; border-radius: 999px; text-decoration: none; font-size: 14px; transition: transform .15s; }
.cta:hover { transform: translateY(-2px); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0 6vw 8vh; }
.card { background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 4px 18px rgb(43 33 24 / .06); }
.card h3 { margin-bottom: 8px; }
.card p { color: #6b5847; font-size: 14px; line-height: 1.55; margin-bottom: 14px; }
.card span { color: #a4552f; font-weight: 700; }
.about, .hours { padding: 6vh 6vw; max-width: 640px; }
.about h2, .hours h2 { margin-bottom: 14px; }
.about p, .hours p { color: #6b5847; line-height: 1.7; }
footer { padding: 26px 6vw; color: #a4937f; font-size: 13px; border-top: 1px solid #eee4d8; }`,
      "app.js": `document.getElementById("year").textContent = new Date().getFullYear();`,
      "README.md": `# ${name}\n\nA one-page coffee shop landing: hero, menu, about, hours.\n\nRun: open index.html.`,
    }),
  },
  {
    id: "dashboard",
    label: "Analytics dashboard",
    keywords: ["dashboard", "analytics", "metrics", "stats", "chart", "kpi"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <main class="dash">
    <h1>${name}</h1>
    <div class="stats">
      <div class="stat"><span>Visitors</span><strong>12,480</strong><em>+8.2%</em></div>
      <div class="stat"><span>Orders</span><strong>1,243</strong><em>+3.1%</em></div>
      <div class="stat"><span>Conversion</span><strong>4.7%</strong><em class="down">−0.4%</em></div>
      <div class="stat"><span>Avg. order</span><strong>$38.2</strong><em>+$0.6</em></div>
    </div>
    <div class="chart-card">
      <div class="chart-head"><h2>Sales trend</h2>
        <div><button id="p-week" class="pbtn on">Week</button><button id="p-month" class="pbtn">Month</button></div>
      </div>
      <svg id="chart" viewBox="0 0 480 160" preserveAspectRatio="none">
        <polyline points="" fill="none" stroke="#0f9d8f" stroke-width="2.5" stroke-linejoin="round"/>
        <circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/><circle r="4" fill="#0f9d8f"/>
      </svg>
    </div>
  </main>`
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #f6f7fb; padding: 32px 5vw; }
h1 { font-size: 22px; margin-bottom: 20px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 18px; }
.stat { background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgb(16 24 40 / .05); }
.stat span { color: #7a8194; font-size: 12.5px; }
.stat strong { display: block; font-size: 24px; margin: 6px 0 4px; }
.stat em { font-style: normal; color: #16a34a; font-size: 12.5px; font-weight: 600; }
.stat em.down { color: #dc2626; }
.chart-card { background: #fff; border-radius: 14px; padding: 22px; box-shadow: 0 2px 10px rgb(16 24 40 / .05); }
.chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.chart-head h2 { font-size: 16px; }
.pbtn { border: 1px solid #e3e5eb; background: #fff; border-radius: 8px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; margin-left: 6px; color: #565b66; }
.pbtn.on { background: #0f9d8f; border-color: #0f9d8f; color: #fff; }
svg { width: 100%; height: 180px; }`,
      "app.js": `var DATA = { week: [12, 18, 14, 22, 28, 24, 31], month: [120, 180, 150, 220, 280, 240, 310] };
function draw(key) {
  var vals = DATA[key];
  var svg = document.getElementById("chart");
  var max = Math.max.apply(null, vals);
  var pts = vals.map(function (v, i) {
    return Math.round(i * (480 / (vals.length - 1))) + "," + Math.round(150 - (v / max) * 130);
  });
  svg.querySelector("polyline").setAttribute("points", pts.join(" "));
  var circles = svg.querySelectorAll("circle");
  pts.forEach(function (p, i) {
    var xy = p.split(",");
    circles[i].setAttribute("cx", xy[0]);
    circles[i].setAttribute("cy", xy[1]);
  });
}
function setP(btn, key) {
  document.querySelectorAll(".pbtn").forEach(function (b) { b.classList.remove("on"); });
  btn.classList.add("on");
  draw(key);
}
document.getElementById("p-week").onclick = function () { setP(this, "week"); };
document.getElementById("p-month").onclick = function () { setP(this, "month"); };
draw("week");`,
      "README.md": `# ${name}\n\nA dashboard with KPI cards and an SVG chart. The Week/Month toggle redraws the chart.\n\nRun: open index.html.`,
    }),
  },
  {
    id: "snake",
    label: "Snake game",
    keywords: ["game", "snake", "arcade"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <main class="game-wrap">
    <h1>${name}</h1>
    <p class="sub">Controls: arrow keys or WASD</p>
    <div class="board">
      <canvas id="game" width="400" height="400"></canvas>
      <button id="restart" style="display:none">Play again</button>
    </div>
    <p>Score: <strong id="score">0</strong></p>
  </main>`
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #0f172a; color: #e2e8f0; min-height: 100vh; display: grid; place-items: center; }
.game-wrap { text-align: center; padding: 24px; }
h1 { font-size: 24px; margin-bottom: 6px; }
.sub { color: #64748b; font-size: 13px; margin-bottom: 18px; }
.board { position: relative; display: inline-block; }
canvas { border-radius: 12px; border: 1px solid #1e293b; display: block; max-width: 90vw; }
#restart { position: absolute; left: 50%; top: 58%; transform: translate(-50%, -50%); background: #22c55e; color: #052e16; border: none; padding: 12px 22px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; }
strong { color: #22c55e; font-size: 18px; }`,
      "app.js": `var cv = document.getElementById("game");
var ctx = cv.getContext("2d");
var CELL = 20, N = 20;
var snake, dir, food, score, timer, speed;
function place() {
  do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
  while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
}
function start() { clearInterval(timer); timer = setInterval(step, speed); }
function reset() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  score = 0; speed = 130;
  document.getElementById("score").textContent = "0";
  place(); draw(); start();
}
function step() {
  var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(function (s) { return s.x === h.x && s.y === h.y; })) { gameOver(); return; }
  snake.unshift(h);
  if (h.x === food.x && h.y === food.y) {
    score++;
    document.getElementById("score").textContent = score;
    place();
    if (speed > 60) { speed -= 3; start(); }
  } else { snake.pop(); }
  draw();
}
function draw() {
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#22c55e";
  snake.forEach(function (s) { ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2); });
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
}
function gameOver() {
  clearInterval(timer);
  ctx.fillStyle = "rgba(15,23,42,.75)"; ctx.fillRect(0, 0, cv.width, cv.height);
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
      "README.md": `# ${name}\n\nA classic canvas Snake: speeds up with every snack, keeps score, restarts.\n\nRun: open index.html.`,
    }),
  },
  {
    id: "pomodoro",
    label: "Pomodoro timer",
    keywords: ["pomodoro", "timer", "focus", "productivity"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <main class="pomo">
    <h1>${name}</h1>
    <div class="modes">
      <button id="m-focus" class="mode on">Focus 25</button>
      <button id="m-short" class="mode">Break 5</button>
      <button id="m-long" class="mode">Long 15</button>
    </div>
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e4f5f1" stroke-width="8"/>
        <circle id="ring" cx="60" cy="60" r="54" fill="none" stroke="#0f9d8f" stroke-width="8"
                stroke-linecap="round" transform="rotate(-90 60 60)"/>
      </svg>
      <span id="time">25:00</span>
    </div>
    <div class="ctrl">
      <button id="toggle">Start</button>
      <button id="reset" class="ghost">Reset</button>
    </div>
  </main>`
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #f7fbfa; min-height: 100vh; display: grid; place-items: center; }
.pomo { text-align: center; padding: 24px; }
h1 { font-size: 22px; margin-bottom: 16px; }
.modes { display: flex; gap: 8px; justify-content: center; margin-bottom: 26px; }
.mode { border: 1px solid #e3e5eb; background: #fff; border-radius: 999px; padding: 8px 16px; font-size: 13px; cursor: pointer; color: #565b66; }
.mode.on { background: #0f9d8f; border-color: #0f9d8f; color: #fff; }
.ring-wrap { position: relative; width: 240px; margin: 0 auto 26px; }
.ring-wrap svg { width: 100%; }
#time { position: absolute; inset: 0; display: grid; place-items: center; font-size: 44px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ctrl { display: flex; gap: 10px; justify-content: center; }
#toggle { background: #0f9d8f; color: #fff; border: none; border-radius: 10px; padding: 12px 30px; font-size: 15px; font-weight: 600; cursor: pointer; }
#toggle:hover { background: #0c8377; }
.ghost { background: none; border: 1px solid #e3e5eb; border-radius: 10px; padding: 12px 20px; cursor: pointer; color: #565b66; }`,
      "app.js": `var MODES = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
var mode = "focus", left = MODES.focus, tick = null;
var timeEl = document.getElementById("time");
var ring = document.getElementById("ring");
var C = 2 * Math.PI * 54;
ring.style.strokeDasharray = C;
function fmt(s) {
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
}
function render() {
  timeEl.textContent = fmt(left);
  ring.style.strokeDashoffset = C * (1 - left / MODES[mode]);
  document.title = fmt(left) + " — Pomodoro";
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
    this.classList.add("on");
    render();
  };
});
render();`,
      "README.md": `# ${name}\n\nA Pomodoro timer with an SVG progress ring and 25/5/15-minute modes. Updates the tab title.\n\nRun: open index.html.`,
    }),
  },
  {
    id: "notes",
    label: "Markdown notes",
    keywords: ["notes", "notebook", "markdown", "diary", "journal"],
    build: (name) => ({
      "index.html": shell(
        name,
        `  <main class="notes">
    <aside>
      <button id="new">+ New note</button>
      <ul id="list"></ul>
    </aside>
    <section>
      <input id="title" placeholder="Title…" />
      <textarea id="body" placeholder="Note text… Supports **bold**, *italic*, \`code\`"></textarea>
      <div id="preview" class="preview"></div>
    </section>
  </main>`
      ),
      "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #f6f7fb; }
.notes { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
aside { background: #fff; border-right: 1px solid #e3e5eb; padding: 16px; overflow-y: auto; }
#new { width: 100%; background: #0f9d8f; color: #fff; border: none; border-radius: 10px; padding: 10px; font-weight: 600; cursor: pointer; margin-bottom: 14px; }
#list { list-style: none; padding: 0; display: grid; gap: 6px; }
#list li { padding: 10px 12px; border-radius: 9px; cursor: pointer; font-size: 13.5px; color: #565b66; }
#list li:hover { background: #f2f3f6; }
#list li.on { background: #e4f5f1; color: #0c8377; font-weight: 600; }
section { padding: 22px; display: grid; grid-template-rows: auto 1fr 1fr; gap: 12px; overflow: hidden; }
#title { border: none; background: none; font-size: 22px; font-weight: 700; outline: none; }
textarea, .preview { border: 1px solid #e3e5eb; border-radius: 12px; background: #fff; padding: 16px; font-size: 14px; line-height: 1.65; overflow-y: auto; }
textarea { resize: none; outline: none; font-family: ui-monospace, monospace; font-size: 13px; }
.preview code { background: #f2f3f6; padding: 1px 5px; border-radius: 4px; }`,
      "app.js": `var KEY = "aide-notes-v1";
function loadNotes() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
var notes = loadNotes();
var active = 0;
var listEl = document.getElementById("list");
var titleEl = document.getElementById("title");
var bodyEl = document.getElementById("body");
var prevEl = document.getElementById("preview");
function save() { localStorage.setItem(KEY, JSON.stringify(notes)); }
function md(t) {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
    .replace(/\\*([^*]+)\\*/g, "<em>$1</em>")
    .replace(/\`([^\`]+)\`/g, "<code>$1</code>")
    .replace(/\\n/g, "<br/>");
}
function render() {
  listEl.innerHTML = "";
  notes.forEach(function (n, i) {
    var li = document.createElement("li");
    li.textContent = n.title || "Untitled";
    if (i === active) li.className = "on";
    li.onclick = function () { active = i; openNote(); };
    listEl.appendChild(li);
  });
  var n = notes[active];
  titleEl.value = n ? n.title : "";
  bodyEl.value = n ? n.body : "";
  prevEl.innerHTML = n ? md(n.body) : "";
}
function openNote() { render(); }
document.getElementById("new").onclick = function () {
  notes.unshift({ title: "", body: "" });
  active = 0; save(); render(); titleEl.focus();
};
titleEl.oninput = function () { notes[active].title = this.value; save(); render(); };
bodyEl.oninput = function () { notes[active].body = this.value; save(); prevEl.innerHTML = md(this.value); };
if (!notes.length) notes.push({ title: "Hi!", body: "This is your first note. Write **markdown** right here." });
save(); render();`,
      "README.md": `# ${name}\n\nA notes app with a sidebar list, localStorage autosave and a live mini-markdown preview.\n\nRun: open index.html.`,
    }),
  },
];

export const GENERIC: TemplateDef = {
  id: "generic",
  label: "Starter app",
  keywords: [],
  build: (name, desc) => ({
    "index.html": shell(
      name,
      `  <main class="app">
    <span class="mark">◈</span>
    <h1>${name}</h1>
    <p class="desc">${desc || "A project created from scratch by AiDe Coder."}</p>
    <button id="go">Click me</button>
    <p id="out" class="out"></p>
  </main>`
    ),
    "styles.css": `* { box-sizing: border-box; margin: 0; font-family: system-ui, sans-serif; }
body { background: #f6f7fb; min-height: 100vh; display: grid; place-items: center; }
.app { text-align: center; padding: 40px; max-width: 480px; }
.mark { font-size: 34px; color: #0f9d8f; }
h1 { font-size: 26px; margin: 12px 0 8px; }
.desc { color: #565b66; line-height: 1.6; margin-bottom: 22px; }
#go { background: #0f9d8f; color: #fff; border: none; border-radius: 10px; padding: 12px 26px; font-size: 15px; font-weight: 600; cursor: pointer; transition: transform .12s; }
#go:hover { transform: translateY(-2px); background: #0c8377; }
.out { margin-top: 16px; color: #0f9d8f; font-weight: 600; min-height: 20px; }`,
    "app.js": `var n = 0;
document.getElementById("go").onclick = function () {
  n++;
  document.getElementById("out").textContent = "Clicks: " + n;
};`,
    "README.md": `# ${name}\n\nA starter single-page app.\n\nTask: ${desc}\n\nRun: open index.html.`,
  }),
};

export function pickTemplate(desc: string): TemplateDef {
  const d = desc.toLowerCase();
  return TEMPLATES.find((t) => t.keywords.some((k) => d.includes(k))) ?? GENERIC;
}

export function deriveName(desc: string, tplId: string): string {
  const defaults: Record<string, string> = {
    todo: "My Tasks", landing: "Grain", dashboard: "Analytics", snake: "Snake",
    pomodoro: "Focus Timer", notes: "Notes", generic: "My App",
  };
  const m = /["«”]([^"»”]+)["»”]/.exec(desc);
  if (m) return m[1];
  return defaults[tplId] ?? "My App";
}
