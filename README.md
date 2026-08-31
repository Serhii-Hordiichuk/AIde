<h1 align="center"><code>&gt;_</code> AiDe — AI-native studio &amp; coder</h1>

<p align="center">
  Chat with free LLM providers · build working web apps from a sentence · interpret live conversations<br/>
  <b>Zero paid models. Zero tracking. Keys never leave your browser.</b>
</p>

## What's inside

- **💬 Chat** — streaming playground over 23 free providers (Pollinations keyless, Google, Qwen Cloud, Groq, Cerebras, SambaNova, NVIDIA NIM, SiliconFlow, OpenRouter, local Ollama / LM Studio / vLLM / llama.cpp…). `Auto Free` and `Auto Local` routing, Think / Web Search / Deep Research modes, voice read-aloud.
- **🛠 Coder** — describe an app in one sentence: the Architect decomposes it by specialty (UI Designer, Frontend Engineer, Technical Writer, QA), the crew writes real files, QA builds a live preview. With a free API reachable the code comes from a live model; offline a built-in generator ships working apps.
- **🌍 Translate** — instant text translation with auto-detect, a push-to-talk **live interpreter** for two people on one device (60+ languages & dialects), and chunked document translation.
- **🔐 DID login** — self-sovereign identity (`did:key`, ECDSA P-256) generated on-device. No email, no servers, backup-file restore.
- **🎨 Adaptive UI** — dark/light/auto themes, 4 languages (EN / UK / 中文 / العربية with full RTL), Ukrainian state-color theme + tryzub, Chinese "国潮" cinnabar-gold theme + seal stamp.
- **Live model catalog** — models are fetched from each provider's own `/models` API; no stale lists.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Deploy to GitHub Pages

The repo ships with `.github/workflows/deploy.yml` (Node 22, `vite build --base=./`).

1. Push to `main`.
2. Ensure one of:
   - **Settings → Pages → Build and deployment → Source: GitHub Actions**, or
   - **Settings → Actions → General → Workflow permissions → Read and write** (lets the workflow enable Pages itself).
3. The site publishes to `https://<user>.github.io/<repo>/`. Custom domain: add a `CNAME` file to `public/`.

## Privacy

API keys, chats, projects, translations and the DID live in `localStorage` only. Requests go directly from your browser to the provider you chose — AiDe has no backend.

## License

[MIT](LICENSE)
