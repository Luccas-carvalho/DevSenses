# DevSenses — MVP Plan

> Tu deixou IA escrever. Deixa o DevSenses te ensinar o que ela fez.

Foco: **explicador educacional de diff** com IA. Não é git client. Não é IDE. É o tutor que abre o diff e ensina.

Stack: Electron 39 · React 19 · Tailwind v4 · TypeScript · better-sqlite3 · Anthropic SDK.

---

## Status atual (pós-pivot)

**Já entregue:**
- Onboarding (Welcome, Workspace, API key, Profile, Stack, Goals, Style, Done)
- Sidebar projeto (recents · favoritos · branch picker reflog-aware)
- Diff viewer (sintaxe, media preview com cache, expand context)
- Análise IA full-diff com streaming (Sparkles, Markdown render)
- Painel Explicação (toggle Cmd+Shift+P, panel ratio persistido)
- Comentários inline ancorados a hunks
- Glossário (termos persistidos por projeto)
- Histórico de explicações por branch
- Professor Turbo (depth toggle)
- Empty states educacionais (3 pilares, steps numerados)
- Tooltip system + ContextMenu portal
- Pulsing CTA "Explicar" enquanto idle (header + EmptyAnalysis)

**Removido conscientemente (anti-scope-creep):**
- Commit / undo commit / push / pull / publish branch
- New branch / rename / delete / merge / discard
- PR creation / Clone repo
- Stash / discard
- Branch app-menu inteiro

---

## Visão MVP

Lançar **público** com o ciclo educacional completo:

1. Usuário edita código (ou Cursor/Copilot edita)
2. DevSenses detecta diff
3. IA explica no nível do usuário
4. Usuário responde quiz → IA reforça gaps
5. Termos novos vão pro glossário pessoal
6. Histórico permite revisitar aprendizado por branch

Diferencial: **não é stackoverflow nem chatGPT genérico** — é tutor que vê *teu* código real, no *teu* nível, *enquanto* tu codifica.

---

## Sprint 1 — Loop educacional core (6 dias)

Objetivo: fechar ciclo aprender → testar → reforçar.

### S1.1 — Quiz pós-explicação (1d) — P0
Após explicação, IA gera 2-3 perguntas múltipla escolha sobre conceitos abordados. Usuário responde, IA dá feedback.

- **Files**: `src/renderer/src/components/analysis/Quiz.tsx`, `src/main/ai/quiz-generator.ts`, `src/shared/ipc-contract.ts` (`ai:generateQuiz`)
- **Schema**: `quizzes` table (id, analysis_id, question, options[], correct_idx, user_answer, created_at)
- **Prompt**: "Baseado nesta explicação, gere 2 perguntas testando o conceito mais central. JSON: `[{q, options[4], correctIdx, explainCorrect, explainWrong}]`"
- **UX**: cards expansíveis abaixo do markdown da análise, badge ✓/✗ após responder

### S1.2 — Slider de profundidade (3h) — P0
Slider 1-5: ELI5 → Iniciante → Médio → Senior → Especialista. Reanalisa com novo nível.

- **Files**: `src/renderer/src/components/analysis/DepthSlider.tsx`, ajustar `src/main/ai/explain.ts` (pegar depth do settings)
- **Settings key**: `analysis_depth` (1-5, default 3)
- **Prompt insertion**: cada nível tem template específico (ELI5 = analogias, Especialista = trade-offs algorítmicos)

### S1.3 — Personas dropdown (2h) — P1
Trocar persona do tutor: Padrão / Sarcástico / Pragmático / Acadêmico / Mentor amigo.

- **Files**: `src/renderer/src/components/analysis/PersonaPicker.tsx`, `src/shared/personas.ts`
- **Settings**: `analysis_persona` (string enum)
- **Prompt**: prefix system com persona definition

### S1.4 — Term-link clicável (4h) — P0
Quando IA menciona termo do glossário OU termo técnico, vira link. Click abre popover com definição expandida + "Explicar mais".

- **Files**: `src/renderer/src/components/analysis/TermLink.tsx`, regex post-process no Markdown render
- **Backend**: `ai:explainTerm` IPC (input: term + context)
- **Glossário**: auto-add quando usuário clica "salvar termo"

**Entrega Sprint 1**: ciclo educacional fechado.

---

## Sprint 2 — Engajamento ativo (5 dias)

Objetivo: forçar o usuário a *pensar*, não só ler.

### S2.1 — Modo Socrático (1d) — P1
Toggle "Me ensina perguntando". IA não dá resposta direta — faz perguntas guiadas, espera usuário responder, então confirma/corrige.

- **Files**: `src/renderer/src/components/analysis/SocraticChat.tsx`, `src/main/ai/socratic.ts`
- **State**: chat thread per analysis
- **Prompt**: system instrui "nunca dê resposta direta antes do usuário tentar"

### S2.2 — Cmd+K cheat sheet (4h) — P1
Comando rápido para qualquer trecho selecionado: gera cheat-sheet markdown (sintaxe, gotchas, exemplos).

- **Files**: `src/renderer/src/components/CheatSheetDialog.tsx`, hotkey global no Project page
- **Backend**: `ai:cheatSheet` IPC

### S2.3 — Big-O auto-detect (3h) — P2
Quando código tem loop/recursão, IA mostra badge de complexidade ("O(n²) — explicar"). Click expande análise.

- **Files**: `src/renderer/src/components/analysis/ComplexityBadge.tsx`
- **Heuristic**: regex pre-pass detecta `for/while/recursive call`, IA confirma e calcula

### S2.4 — Sticky concept tracker (2h) — P2
Sidebar direita extra: lista conceitos abordados na sessão atual. Click = volta pra explicação onde apareceu.

- **Files**: `src/renderer/src/components/ConceptTracker.tsx`, store em `concept-tracker-store.ts`

**Entrega Sprint 2**: usuário interage, não consome passivamente.

---

## Sprint 3 — Diferenciação (5 dias)

Objetivo: features únicas que stackoverflow/chatGPT não têm.

### S3.1 — What-if mode (1.5d) — P1
"E se eu tivesse feito X?" — IA simula trade-off de approach alternativo no *mesmo* diff.

- **Files**: `src/renderer/src/components/analysis/WhatIfPanel.tsx`, `src/main/ai/whatif.ts`
- **UX**: botão "What if" em cada hunk → modal com input + IA gera diff alternativo lado-a-lado

### S3.2 — Caça ao bug (1d) — P2
IA injeta bug sutil no código real do usuário e desafia ele a achar. Educational gamification.

- **Files**: `src/renderer/src/components/analysis/BugHunt.tsx`, `src/main/ai/bug-injector.ts`
- **Safety**: nunca aplica no código real, sempre em snippet copiado pro modal

### S3.3 — Recap diário (4h) — P1
Notificação 18h: "Hoje você aprendeu: useMemo, debounce, optimistic update. Quiz rápido?"

- **Files**: `src/renderer/src/components/RecapDialog.tsx`, `src/main/scheduler/daily-recap.ts`
- **Logic**: cron-like check, agrega glossário do dia, gera 3 perguntas review

### S3.4 — AI authorship detection (1d) — P2
Detecta se diff foi escrito por IA (heurística + flag manual). Adapta tom da explicação ("essa IA usou pattern X — vamos ver se faz sentido").

- **Files**: `src/main/ai/author-detect.ts`, integra com prompt principal
- **Heuristic**: comentários verbosos, padrão de naming, mudanças muito grandes em 1 commit

**Entrega Sprint 3**: features únicas pro positioning.

---

## Sprint 4 — Lançamento (4 dias)

### S4.1 — README + docs (1d) — P0
- Hero gif (asciinema ou screenshot animado)
- Quickstart (instalar → abrir repo → primeira explicação em <30s)
- FAQ (privacidade: tudo local, IA via API key do user)
- Roadmap aberto

### S4.2 — Landing page (1d) — P0
- `web/` folder já existe — usar
- Hero: "Tu deixou IA escrever. DevSenses te ensina."
- Demo video 30s
- Download buttons (DMG mac · win/linux later)
- Github star CTA

### S4.3 — Code signing + notarization mac (1d) — P0
- Apple Developer account
- `electron-builder.yml` config notarize
- Test em mac sem dev mode

### S4.4 — Product Hunt + HN launch (1d) — P0
- Schedule PH (terça 12am PST)
- HN "Show HN" texto
- Reddit r/programming, r/learnprogramming
- Twitter thread

**Entrega Sprint 4**: público.

---

## Pós-MVP (backlog)

- Suporte Windows/Linux build
- Integração direta com Cursor/Copilot (detect AI commits via VSCode extension)
- Multi-language UI (en, es)
- Export histórico → markdown/PDF
- Compartilhar explicação como link público (anonimizado)
- Plug-in pra VSCode (sidecar)
- Análise de PR inteiro (não só working tree)
- Mode "review do meu código" (explica trecho selecionado, não diff)

---

## Total estimativa

| Sprint | Dias | Conteúdo |
|--------|-----:|----------|
| 1 | 6 | Loop educacional core |
| 2 | 5 | Engajamento ativo |
| 3 | 5 | Diferenciação |
| 4 | 4 | Lançamento |
| **Total** | **20 dias úteis** | **~4 semanas** |

---

## Métricas de sucesso pós-launch

- D1 retention > 30%
- D7 retention > 15%
- Avg quiz attempts/user/week > 5
- GitHub stars > 200 em 30 dias
- Discord/issues feedback qualitativo positivo

---

## Princípios

1. **Não pivotar de novo**. Educacional. Não git client.
2. **Tudo local**. Diff nunca sai do device exceto pra API IA do user.
3. **API key do user**. Não pagamos OpenAI/Anthropic por usuário.
4. **Free + open source**. Premium futuro talvez (sync cloud, team features).
5. **PT-BR first**. Mercado brasileiro de junior dev é forte e desatendido.
