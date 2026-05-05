# DevSenses

IDE desktop com IA educacional. Pega seus diffs do git, explica o que foi feito conforme seu nivel de senioridade e ensina os conceitos por tras. Roda CLIs IA que voce ja tem instaladas (claude, codex, gemini, aider, ollama).

## Status

Em desenvolvimento — Fase 0 (Fundacao) + Fase 1 (Onboarding).

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:mac    # .dmg
npm run build:win    # .exe
```

## Stack

Electron 39 + Vite 7 + React 19 + TS 5 + Tailwind 4 + shadcn/ui + better-sqlite3 + electron-builder.
