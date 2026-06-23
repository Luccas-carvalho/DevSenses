<div align="center">
  <img src="build/icon.png" width="128" height="128" alt="DevSenses" />

# DevSenses

**You let AI write it. Let DevSenses teach you what it did.**

Desktop app that reads your repo's diff and explains every change at your level — with a configurable tone, adaptive quiz, personal glossary, Socratic mode, what-if, bug hunt and AI-authorship detection.

100% local. Your API key. Open source. Portuguese-first UI.

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome"></a>
  <img src="https://img.shields.io/badge/platform-mac%20%7C%20win%20%7C%20linux-lightgrey.svg" alt="Platforms">
</p>

[Download (mac)](#-install) · [How it works](#-how-it-works) · [Features](FEATURES.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](MVP_PLAN.md)

🇧🇷 **[Versão em Português](README.pt-BR.md)**

</div>

> The app's UI is in Brazilian Portuguese (PT-BR first). This README is in English; a full Portuguese version is linked above.

---

## ⚡ Quickstart

```bash
git clone https://github.com/Luccas-carvalho/DevSenses.git
cd DevSenses
npm install
npm run dev
```

Go through onboarding (it calibrates seniority + AI provider + tone). Point it at a git repo. Edit a file (or let Cursor/Copilot do it). Click **Explain**. Done — the AI reads the whole diff and teaches you line by line.

Production build (.dmg on mac):
```bash
npm run build:mac:arm64
# Output in release/devsenses-X.X.X.dmg
```

## 🧠 How it works

1. **You edit code** (by hand, Cursor, Copilot, Claude Code, any tool)
2. **DevSenses reads the full git diff** — uncommitted, committed, or everything
3. **The AI explains** at the level you set (For-a-kid → Deep) with the chosen tone (Mentor / Pragmatic / Sarcastic / Academic)
4. **Adaptive learning**: post-explanation quiz, per-concept mastery (4 levels), mastered concepts automatically drop out of future quizzes
5. **Power tools**: ⌘K cheat sheet for any snippet, automatic Big-O complexity badges, what-if to compare approaches, bug hunt to practice code review

## ✨ Key features

- 🎯 **5 depth levels** — For-a-kid / Brief / Balanced / Detailed / Deep
- 🎭 **5 tutor personas** — Default / Friendly mentor / Pragmatic / Sarcastic / Academic
- 🧠 **Adaptive quiz** — the AI only asks about what you haven't mastered yet
- 📚 **Personal glossary** — clickable technical terms in the markdown, definitions cached
- 🤔 **Socratic mode** — the AI asks before answering, forcing you to think
- ⚡ **⌘K cheat sheet** — select code, generate a cheat sheet (syntax / gotchas / examples)
- 📊 **Automatic Big-O** — flags nested loops, find-in-loop, recursion without memo
- 💡 **What-if** — "what if I'd done X?" — the AI compares trade-offs in a table
- 🐛 **Bug hunt** — the AI injects a subtle bug for you to practice code review
- 🤖 **AI-authorship detection** — heuristic with 8 signals, score 0-100, visible flag
- 🌌 **Cosmic vibe** — galaxy loading, post-onboarding cosmic transition, auroras

Full list in [FEATURES.md](FEATURES.md).

## 🎯 Who it's for

- **Junior learning** — wants to understand what their AI wrote before approving a PR
- **Mid leveling up to senior** — explanation calibrated to your level, depth rises as you master concepts
- **Senior short on time** — fast reading of large agent-written diffs, with automatic flags for bad complexity

## 🔌 Supported providers

- **Claude Code** (CLI) — `claude`
- **Codex** (CLI) — `codex`
- **Gemini** (CLI) — `gemini`
- **Aider** (CLI) — `aider`
- **Ollama** (local) — `ollama`

DevSenses auto-detects what you have installed on your PATH during onboarding. Everything is BYOK (Bring Your Own Key) — DevSenses never charges you for AI.

## 🛠 Stack

- Electron 39 + electron-vite
- React 19 + TypeScript + Tailwind v4
- better-sqlite3 (embedded migrations, schema versioned v1-v9)
- Zustand (state) + SWR-like patterns
- Lucide icons (zero emoji in the UI)

## 📥 Install

### Mac (Apple Silicon)

Download the `.dmg` from the [latest release](https://github.com/Luccas-carvalho/DevSenses/releases) and drag it to Applications.

> Builds are **not signed yet** (code signing in progress). On first launch macOS
> shows an "unverified app" warning. To open it:
> **right-click the app → Open → Open** (only the first time).
> If macOS still blocks it: System Settings → Privacy & Security → "Open Anyway".

### Build from source (any platform)

```bash
git clone https://github.com/Luccas-carvalho/DevSenses.git
cd DevSenses
npm install
npm run build:mac      # mac (.dmg)
npm run build:win      # windows (.exe NSIS)
npm run build:linux    # linux (.AppImage)
```

> Official releases currently cover macOS. Windows/Linux builds come from source
> (still in validation). Contributions to test them are welcome.

## 🔒 Privacy

- **Your code never goes to a server of ours** — there is no DevSenses backend.
- The **diff** is only sent to the AI provider **you** chose (with your own key). With Ollama, it never leaves the machine.
- **Telemetry is off by default** (opt-in). When on, events stay in a **local** SQLite database and can be cleared in Settings → Privacy.

Details in [`SECURITY.md`](SECURITY.md).

## 📚 Documentation

- [`FEATURES.md`](FEATURES.md) — full checklist of everything (✅ shipped / ⏳ backlog).
- [`MVP_PLAN.md`](MVP_PLAN.md) — sprints 1-4 with estimates.
- [`SPRINT_1_PLAN.md`](SPRINT_1_PLAN.md) — sprint 1 technical detail.
- [`COMMANDS.md`](COMMANDS.md) — useful commands (build dmg, dev, regenerate icon).
- [`CLAUDE.md`](CLAUDE.md) — instructions for Claude Code (continuous authoring).

## 🎤 Pitch

> Cursor / Copilot / Claude Code already write code for you.
> The real question now is: **are you learning, or just approving what the AI spat out?**
>
> DevSenses is the tutor that sees the diff your AI made, explains it at your level,
> tests you with a quiz that learns from your answers, and marks concepts as mastered
> after N correct in a row.
>
> It's not another AI chat. It's continuous learning on top of your project's real code.

## 🤝 Contributing

PRs and issues are welcome — especially bug reports with a diff that reproduces the
problem. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) (setup, conventions, PR flow).
Participants follow the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Security
vulnerability: see [`SECURITY.md`](SECURITY.md) (don't open a public issue).

## 📜 License

[MIT](LICENSE) © Luccas Carvalho.

---

<div align="center">
<sub>Made in 🇧🇷 by <a href="https://github.com/Luccas-carvalho">Luccas Carvalho</a></sub>
</div>
