<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/132de775-d892-4a5e-93b5-e94af1a15f0e/_result.png" alt="AiDe — AI Studio & Coder" width="640" />
</p>

<h1 align="center">AiDe <em>— AI-native studio & coder</em></h1>

<p align="center">
  Chat with free LLM providers · scaffold working web apps from a single sentence<br/>
  <b>Zero paid models. Zero tracking. Keys never leave your browser.</b>
</p>

<p align="center">
  <a href="#deploy-to-github-pages">Deploy guide</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#free-providers">Providers</a> ·
  <a href="#architecture">Architecture</a>
</p>

---

## What's inside

**💬 Chat** — a streaming playground that talks to any free provider:

- Token-by-token streaming, stop / regenerate, copy, markdown with code blocks
- `Auto Free` routing — picks the best free model for your setup (keyless → free tiers → local)
- `Auto Local` routing — routes straight to your local runtimes (Ollama, LM Studio, vLLM, llama.cpp, KoboldCPP)
- Think / Web search / Deep Research modes wired into the system prompt
- Every request goes to a real API — there is no canned demo mode

**🛠 Coder** — builds projects from scratch with a **specialist crew**:

1. The **Architect** decomposes your brief into subtasks by specialty
2. **UI Designer** shapes the markup & styles, **Frontend Engineer** writes the logic, **Technical Writer** documents, **QA** builds and smoke-tests
3. You watch the task board, colored terminal log and file tree update live — then get a **working preview** in an iframe
4. Follow-up tweaks ("make the accent green", "rename it to …") rebuild instantly
5. If a free API is reachable (Pollinations is keyless!), the crew generates with the real model; otherwise the built-in generator ships a fully working app offline

## Free providers

| Provider | Access | Notes |
|---|---|---|
| **Pollinations** | 🟢 keyless, ready out of the box | SSE streaming, OpenAI-compatible |
| Google AI Studio | free key | Gemini Flash-Lite, 1M context |
| Groq / Cerebras / SambaNova | free keys | 500–1000+ tok/s inference |
| Cloudflare AI Gateway | free key | OpenAI-compatible router |
| Hugging Face | free token | Inference router |
| GitHub Models | free token | `gh` CLI login, rate-limited |
| OpenRouter | free key | `:free` model variants |
| Ollama · LM Studio · vLLM · llama.cpp · LocalAI · KoboldCPP | local, no key | configurable base URLs |

## Quick start

```bash
git clone https://github.com/YOUR-USERNAME/aide-studio.git
cd aide-studio
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # outputs dist/
npm run preview    # serve the build locally
```

## Deploy to GitHub Pages

### Option A — GitHub Actions (recommended, zero config)

1. Create a repository (e.g. `AIde`) and push this project:

   ```bash
   git init
   git add .
   git commit -m "aide studio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/AIde.git
   git push -u origin main
   ```

2. That's it. The bundled workflow (`.github/workflows/deploy.yml`) **enables GitHub
   Pages automatically** via the API on the first run (`build_type: workflow`), builds
   with a relative base (`npx vite build --base=./`) and publishes `dist/`. Your site
   goes live at `https://YOUR-USERNAME.github.io/AIde/` on every push.

   > If the auto-enable step fails (restricted org policy), enable it once manually:
   > **Settings → Pages → Build and deployment → Source → GitHub Actions**,
   > then re-run the workflow from the **Actions** tab.
   >
   > Also make sure **Settings → Actions → General → Workflow permissions** is set to
   > **Read and write permissions**.

### Option B — manual `gh-pages` branch

```bash
npm run build -- --base=./
npx gh-pages -d dist
```

Then set **Settings → Pages → Source → Deploy from a branch → gh-pages / root**.

### Custom domain

Add a `CNAME` file with your domain to `public/` (e.g. `echo "studio.example.com" > public/CNAME`)
and configure the DNS `A`/`CNAME` records per GitHub's docs. The relative base already works
on any domain.

## Architecture

```
src/
├── App.tsx                  sidebar · mode switch · settings modal · status bar
├── components/
│   ├── ChatMode.tsx         streaming chat, stop/regen, reasoning/search modes
│   ├── CoderMode.tsx        task board · file tree · preview iframe · terminal
│   ├── ModelPicker.tsx      grouped catalog + Auto Free / Auto Local routing
│   ├── StatusBar.tsx        IDE-style session strip
│   └── Icons.tsx            inline SVG set + brand mark / wordmark
├── data/
│   ├── providers.ts         15 free providers (keyless · free tier · local)
│   └── models.ts            free-only model registry + routing resolvers
└── lib/
    ├── llm.ts               OpenAI-compat SSE · Pollinations · Google SSE adapters
    ├── plan.ts              task decomposition by specialist roles
    ├── engine.ts            LLM project generation + offline builder
    └── templates.ts         7 fully working starter apps
```

## Privacy

- API keys are stored in `localStorage` only and sent directly to the provider you chose
- No analytics, no cookies, no third-party scripts
- Chats, projects and settings persist locally in your browser

## License

[MIT](LICENSE)
