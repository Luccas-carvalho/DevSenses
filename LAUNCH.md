# Launch Playbook

Templates de copy pra Product Hunt, Hacker News, Reddit, Twitter, LinkedIn. Adaptar antes de postar.

---

## 🎯 Posicionamento (NÃO mudar)

- **Tagline**: "Tu deixou IA escrever. Deixa o DevSenses te ensinar o que ela fez."
- **Tagline (en)**: "You let AI write your code. Let DevSenses teach you what it actually did."
- **Categoria**: Developer Tools / Education
- **Público alvo**: Devs juniors a mids que usam Cursor / Copilot / Claude Code mas querem aprender de verdade.

---

## 🚀 Product Hunt

### Tagline (60 chars max)
> AI tutor that explains the diff your AI just wrote — at your level.

### Description (260 chars max)
> Cursor wrote your code. But did you actually learn anything? DevSenses reads your git diff, explains every change at your skill level, gives adaptive quizzes, and tracks which concepts you've mastered. 100% local, BYOK, open source.

### First comment (maker)
> Hey PH 👋
>
> I built DevSenses because I noticed something painful: I was approving more PRs from Cursor/Copilot than I was actually understanding. The code worked, tests passed, but I couldn't explain a third of what was changed.
>
> So I made a tutor that sees the diff your AI just wrote and teaches you. Not generic explanations — explanations calibrated to YOUR seniority, with quizzes that get smarter as you answer them, and a glossary that grows from every term you click.
>
> Some highlights:
> - **Adaptive quiz** — once you've mastered a concept (5 right answers in a row), it stops asking. The IA biases new questions toward what you don't know yet.
> - **5 personas** — Mentor / Pragmatic / Sarcastic / Academic / Default. Pick the tone that helps you learn.
> - **Socratic mode** — IA asks instead of answers. Forces you to think before reading the solution.
> - **Cmd+K cheat sheet** — select any code, get a full breakdown (syntax / gotchas / examples / when not to use).
> - **Bug hunt** — IA injects a subtle bug into your snippet and challenges you to find it.
> - **AI authorship detection** — heuristic flags how likely a diff was AI-written, with score + signals.
>
> Everything runs local. You bring your own API key (Claude / Codex / Gemini / Aider / Ollama). No subscription, no telemetry without consent.
>
> Open source, MIT. Built solo in Brazil 🇧🇷.
>
> Roadmap is public in the repo. Would love your feedback — especially what feature would you want next?

### Tags
`developer-tools` `education` `artificial-intelligence` `productivity` `open-source` `electron`

---

## 📰 Hacker News (Show HN)

### Title (80 chars max)
> Show HN: DevSenses – AI tutor that explains the diff your AI just wrote

### Body
```
Hi HN,

I'm a Brazilian dev and over the last 6 months I noticed I was reading less code than I was approving. Cursor would write 200 lines, tests passed, I'd merge. Two weeks later I couldn't explain a quarter of it in an interview.

So I built DevSenses. It's a desktop app (Electron + React) that:

1. Reads the git diff in your repo (uncommitted, committed, or all)
2. Asks a local CLI AI (Claude Code, Codex, Gemini, Aider, or Ollama) to explain it
3. Calibrates the explanation to your seniority level (intern → senior)
4. Lets you choose tone (mentor / pragmatic / sarcastic / academic)
5. Generates 2-3 multiple-choice questions after the explanation
6. Tracks per-concept mastery — once you nail useState 5 times in a row, it stops quizzing you on it
7. Surfaces concepts you haven't mastered yet to bias future questions

The thing I'm most proud of: it's actually adaptive. Each quiz question is tagged with the concepts it tests. Right answer increments the concept's mastery. Wrong answer resets the streak. After level 3 (mastered), the concept is auto-flagged as learned and skipped in future generations.

Other features I think are cool:
- Cmd+K on any selected code → full cheat sheet (syntax, gotchas, examples)
- Auto Big-O detection (regex heuristic for nested loops, find-in-loop, recursion)
- AI authorship score (8 heuristics — comment density, JSDoc patterns, "let me", verbose names...) — flags how likely a diff was AI-written
- "What if?" mode — describe an alternative approach, IA generates a comparison table
- Bug hunt — IA injects a subtle bug into a snippet, you have to find it (with hint + reveal phases)

Stack: Electron 39 + React 19 + TS + Tailwind v4 + better-sqlite3 (migrations embedded). All data local. BYOK API keys.

It's MIT, code is on GitHub: [link]

Would love HN's brutal feedback. Things I'm specifically wondering:
1. Is "calibrated by seniority" actually useful, or do people just always set max?
2. The Socratic mode forces a different rhythm — is it annoying after 5 minutes?
3. AI authorship heuristic is informational only — is the score actually useful or just noise?

Thanks for reading. Disponho de tempo livre nos próximos dias pra responder.
```

---

## 📱 Reddit

### r/programming title
> I built an open-source desktop tutor that explains the diff your AI just wrote — so you actually learn from Copilot/Cursor

### r/learnprogramming title
> Free tool that quizzes you on the code your AI assistant wrote (so you actually learn it)

### r/webdev title
> [Project] DevSenses — AI tutor for git diffs. Adaptive quiz, mastery tracking, BYOK

### Body (adapt per sub)
```
Hey, I'm a dev who got tired of approving Cursor/Copilot PRs without really understanding them. Built DevSenses as the tutor I wish I had.

It's a desktop app (Mac for now, Win/Linux soon). You point it at your git repo, edit some code (or let AI edit), click Explicar, and:

- It reads the entire diff
- Calls your local AI (Claude Code / Codex / Gemini / Aider / Ollama)
- Explains every change at your skill level (intern → senior)
- Quizzes you afterwards with 2-3 multiple-choice questions
- Tracks which concepts you've mastered (per-concept, not per-quiz)
- Auto-skips topics you've nailed 5 times in a row

Plus:
- Cmd+K cheat sheet on any selected code
- Auto Big-O detection (regex flags loops, recursion)
- AI authorship score — heuristic that flags if a diff "looks LLM-written"
- Socratic mode — IA asks before answering
- "What if?" mode — compare alternative approaches
- Bug hunt — IA injects a subtle bug, you find it

Open source, MIT. BYOK API keys (no subscription).

Repo: [link]
PT-BR but mostly developer English so language shouldn't be a barrier.

Feedback welcome — especially what's missing.
```

---

## 🐦 Twitter / X

### Tweet 1 (hook)
> 6 months ago I noticed I was approving way more Cursor PRs than I was actually reading.
>
> So I built the tutor I wish I had: DevSenses.
>
> 🧠 Reads your git diff
> 🎯 Explains at YOUR level
> 📚 Quizzes you adaptively
> 💯 Open source, BYOK
>
> Demo 👇

### Thread continuation (reply 2)
> The killer feature isn't the explanation — it's the adaptive quiz.
>
> Each question is tagged with concepts. Get useState right 5 times in a row? It stops asking. Wrong on closures? IA prioritizes closure questions next time.
>
> No "explain the same thing 50 times" loop.

### Reply 3
> Other power tools:
> ⌘K cheat sheet on any selected code
> Big-O badges auto-flag nested loops
> "What if?" — IA compares alternative approaches
> AI authorship detection (8 heuristics, score 0-100)
> Socratic mode — IA asks before answering

### Reply 4
> Stack: Electron + React 19 + TS + better-sqlite3
>
> Runs your local CLI AI: Claude Code / Codex / Gemini / Aider / Ollama
>
> Everything stays on your machine. BYOK. MIT licensed.
>
> Repo: [link]

### Reply 5 (CTA)
> If you use Copilot, Cursor, or Claude Code daily and feel like you're losing the learning curve, this is for you.
>
> Star ⭐ on GitHub, try it, and tell me what's missing: [link]

---

## 💼 LinkedIn (long form)

### Title
> Why I built an "AI tutor for AI-written code" — and what it taught me about learning in 2026

### Body
```
[300-500 word essay]

Last quarter I had a brutal realization: I was approving more code from Cursor than I was actually reading. Tests passed, PR shipped, two weeks later I couldn't explain my own commits.

The tools that supposedly free us up to "think bigger" were quietly eroding my ability to think at all.

So I built DevSenses — an open-source desktop tutor that:
- Reads the git diff your AI assistant just wrote
- Explains every change at your seniority level
- Quizzes you afterwards
- Tracks which concepts you've mastered
- Stops asking about topics you've nailed 5 times in a row

What I learned building it:

1. The hard part isn't the AI explanation. It's the calibration. A senior wants trade-offs and worst-case Big-O. A junior wants analogies. A novice wants "imagine this is a recipe..."

2. Multiple-choice questions are underrated. Open-ended quizzes feel impressive but lose people. Forced choice (with plausible distractors) reveals exactly which concept clicked.

3. Mastery tagging is the real magic. Once each question is tagged with the concepts it tests, you can detect — quantitatively — which topics need more practice. The system gets smarter the more you use it.

DevSenses is MIT-licensed, BYOK (bring your own API key — Claude, Codex, Gemini, Aider, or Ollama), and runs 100% locally.

If you've felt your learning slow down as AI sped up your typing, give it a shot. Repo in comments.

What's your strategy for staying technically sharp in the AI era?
```

---

## 📺 Demo Gif/Video Script (90 seconds)

```
[0-5s]   Splash logo
[5-15s]  Show: edit a React file in VS Code with Cursor making changes
[15-25s] Switch to DevSenses → click Explicar → galaxy loading
[25-40s] Streaming explanation in PT-BR: ## Resumo, then ## Detalhes
[40-50s] Show DepthSlider clicking from Equilibrado to Profundo → re-Explicar
[50-60s] Quiz pops up: 3 questions multiple choice, answer correctly → green check
[60-70s] Conceitos tab → show useState with mastery dots filled (3/4)
[70-80s] Cmd+K on a selected line → cheat sheet appears
[80-90s] Cut to logo + tagline + "github.com/Luccas-carvalho/DevSenses"
```

---

## 📅 Timeline ideal

**T-7 days** — Confirma DMG signed, fix blockers, polish landing.

**T-3 days** — Demo gif gravado, postado em hidden test post pra QA.

**T-1 day** — Schedule Product Hunt pra terça 12:01am PST. Linha de cooler na geladeira.

**T+0**:
- 06:00 PT-BR — Tweet thread + LinkedIn
- 12:01 PST — PH live
- 12:05 PST — Show HN post
- 13:00 PST — Reddit r/programming + r/webdev (NÃO ao mesmo tempo, espaçar 30min)
- 14:00 PST — Reddit r/learnprogramming
- Manter respondendo PH/HN o dia inteiro

**T+1** — Resumo de métricas (stars, comments, traffic). Ajustar landing baseado em feedback.

**T+7** — Post-mortem + planning sprint pós-launch.

---

## 🎯 Métricas de sucesso

- D1: 200 GitHub stars, 3000 site visits, 50 first installs
- D7: 500 stars, 100 downloads, 10 GitHub issues / discussions
- D30: 1000 stars, 300 downloads, 5 PRs externos

Se < 30% disso → revisar posicionamento. Se 200%+ → pular Sprint pós-MVP, focar em retenção D7/D30.
