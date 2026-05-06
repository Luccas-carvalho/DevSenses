# DevSenses

IDE desktop com IA educacional. Lê seus diffs do git, explica o que foi feito conforme seu nível de senioridade e ensina os conceitos por trás. Roda CLIs IA que você já tem instaladas (claude, codex, gemini, aider, ollama) — BYOK, zero lock-in.

## Status

- ✅ **Fase 0 — Fundação**: Electron 39 + Vite + React 19 + TS + Tailwind v4 + SQLite + IPC tipado.
- ✅ **Fase 1 — Onboarding**: 8 steps (welcome / name / seniority / provider detect / provider test / theme / workspace / summary).
- ✅ **Fase 2 — Diff Reviewer**: 3 painéis resizable (file list / diff / IA), sub-tabs (Resumo / Detalhes / Conceitos), file watcher, prompt por senioridade, streaming, glossário pessoal, histórico de análises.
- 🚧 **Fase 3 — Browser Tester**: agente IA DOM-aware via Playwright, intensidade Sane/Chaos/Nuclear, screenshots, video replay, cancel mid-run, auto-detect URL do projeto.
- ⏸ **Fase 4 — Pixel-art**: postergado.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:mac     # .dmg
npm run build:win     # .exe (NSIS)
npm run build:linux   # .AppImage
```

Saída em `release/`.

## Stack

Electron 39 · Vite 7 · React 19 · TS 5 · Tailwind 4 · shadcn/ui · better-sqlite3 · Playwright · electron-builder.

## Web

Landing page em `web/` (Next.js 16) — separada do app desktop.
