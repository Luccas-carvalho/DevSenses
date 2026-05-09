# DevSenses — Features

> Tutor de IA que explica o diff que tu (ou tua IA) escreveu — no teu nível, com adaptação contínua.

Lista viva. ✅ = entregue. ⏳ = backlog. ❌ = descartado.

Pra cada item: tagline curta de marketing + nota técnica entre parênteses quando relevante.

---

## 🚀 Primeira impressão

- ✅ **Onboarding cósmico** — 11 passos guiados, transições smooth, encerrando numa animação de galáxia 4.5s estilo "boot do universo".
- ✅ **Modal de skip customizado** — confirmação bonitona, sem janela nativa do macOS feia.
- ✅ **Detecção automática de IA local** — varre PATH, encontra Claude Code / Codex / Gemini / Aider / Ollama instalados, testa conectividade.
- ✅ **Calibração por senioridade** — Estagiário / Junior / Mid / Senior. Influencia profundidade automática + vocabulário.
- ✅ **Quiz de senioridade opcional** — alguns prompts curtos pra estimar nível se o user não souber decidir.
- ✅ **Seleção de profundidade no onboarding** — 5 níveis (Pra criança / Resumido / Equilibrado / Detalhado / Profundo), default sugerido pela seniority.
- ✅ **Seleção de persona do tutor** — 5 tons (Padrão / Mentor amigo / Pragmático / Sarcástico / Acadêmico).
- ✅ **Workspace inicial opcional** — escolhe pasta git, ou pula e configura depois.

---

## 🧠 Núcleo educacional

- ✅ **Explicador de diff streaming** — IA lê todo o diff (working tree, uncommitted ou committed) e gera Resumo + Detalhes por linha em markdown ao vivo.
- ✅ **5 níveis de profundidade ajustáveis** — slider/dropdown no header. Troca instantânea, sem reabrir nada.
- ✅ **5 personas de tutor ajustáveis** — emoji virou ícone Lucide com tints únicos por persona.
- ✅ **Modo Socrático** — toggle. Quando ativo, IA não dá resposta direta: faz pergunta → dá dica → revela resposta. Força o user a pensar.
- ✅ **Term-link clicável** — ~150 termos técnicos (React/JS/TS/web/DB/git/test/arch) viram links no markdown da explicação. Click abre popover com definição + exemplo + "Mais a fundo" (regenerate).
- ✅ **Glossário pessoal automático** — toda explicação solicitada de termo é cacheada. Próxima vez é instantâneo, sem custo de IA.
- ✅ **Tabs Resumo / Detalhes / Conceitos** — 3 vistas da mesma análise. Conceitos = lista canônica de termos não-triviais com exemplos.

---

## 🎯 Aprendizado adaptativo

- ✅ **Quiz pós-explicação** — 2-3 perguntas múltipla-escolha geradas após cada análise. Feedback explicando por que está certo/errado.
- ✅ **Mastery por conceito** — cada questão é taggeada com 1-3 conceitos. Acertou = sobe nível. Errou = reseta streak.
- ✅ **4 níveis de domínio** — Novato → Familiar → Proficiente → Dominado. Indicador visual com 4 pontos coloridos.
- ✅ **Quiz adaptativo** — backend passa pra IA quais conceitos o user **ainda não domina** (pra priorizar) e quais já dominou (pra evitar). Quiz vai ficando inteligente sobre tu.
- ✅ **Auto-aprendizado** — ao atingir Dominado (5 acertos seguidos), conceito sai do quiz automaticamente.
- ✅ **Histórico de explicações por branch** — toda análise fica salva. Volta no tempo, vê o que mudou e foi explicado em cada branch.
- ✅ **Recap diário** — botão BookOpen na Home + auto-open após 18h. Mostra conceitos vistos hoje, com 3 stats (Dominados / Aprendendo / Novos) e mastery dots por concept.

---

## ⚡ Power tools sobre o diff

- ✅ **Cmd+K Cheat Sheet** — seleciona qualquer trecho, ⌘K abre modal com cheat sheet IA (O que faz / Sintaxe / Gotchas / Exemplos / Quando NÃO usar).
- ✅ **Detecção automática de complexidade Big-O** — heurística regex flagra loops aninhados, forEach+includes, find-in-loop, recursão. Badge amber/rose no header do arquivo, click expande razões.
- ✅ **Comentários inline ancorados a hunks** — IA pode marcar trechos específicos com explicação contextual.
- ✅ **Preview de mídia no diff** — PNG/JPG/SVG renderizam side-by-side antes/depois (cache + prefetch, instant).
- ✅ **Search no diff** — ⌘F + navegação entre matches.
- ✅ **Persistência de painel da explicação** — ratio do split entre diff/explicação salvo, restaura próxima vez.
- ✅ **What-if mode** — botão Lightbulb amber → modal com input + 3 sugestões → IA gera tabela comparativa (resumo / o que mudaria / trade-offs / quando preferir cada). ⌘↵ envia.
- ✅ **Caça ao bug** — botão Bug rose → IA injeta erro sutil em selection (ou primeiros 1500 chars). Phases: hunting (com dica opcional + botão revelar) → revealed (linha do bug ➜ destacada + explicação + código corrigido). Botão "Outro" gera novo desafio.
- ✅ **Detecção de autoria IA** — heurística com 8 sinais (comment density, JSDoc, long names, try-catch ratio, frases típicas de LLM, big diffs, type annos, return types). Score 0-100, verdict (humano / misto / IA provável / IA quase certa). Badge clicável no header do diff.

---

## 🎨 Polish & UX

- ✅ **Galaxy loading animation** — IA pensando virou galáxia: 120 stars (4 variantes incluindo cross-flare), 4 órbitas concêntricas com dots orbitando, 3 nebulas drifting, 3 pulse rings escalonados, sun rays conic atrás do core, 3 comets atravessando a tela.
- ✅ **Cosmic transition pós-onboarding** — 4.5s de fade de purple → cosmic dark → background, com 80 stars (warp + bright), 4 orbitais, 3 nebulas, dissolve no final.
- ✅ **Home page cósmica** — gradient purple radial + 3 auroras drifting + 50 stars twinkling (só dark mode), CTA com sheen no hover, recents staggered fade-in.
- ✅ **Symbol pattern overlay no onboarding** — fundo sutil com `<>`, `→`, `///`, `{}`, `()`, `[]` em grade randomizada.
- ✅ **Tooltip system custom** — portal com side/align, delay 350ms, suporte a shortcut hint.
- ✅ **Context menus customizados** — portal style, submenu support, click-outside.
- ✅ **Sticky tabs no painel de explicação** — Resumo/Detalhes/Conceitos colados ao header, conteúdo rola por baixo limpo.
- ✅ **Botão Home no header** — ⌘H volta pra Home de qualquer projeto.
- ✅ **DMG bonitão** — gradient purple aurora, 12 dust particles, drag arrow gradient fade, ícone customizado no Finder via fileicon.
- ✅ **Ícone macOS HIG-compliant** — 824×824 artwork em canvas 1024×1024 (10% safe area), squircle padding, sombra suave.
- ⏳ **Apply orkestral step animations no onboarding** — staggered fadeUp em listas, microinterações refinadas. (parcial)

---

## 🔧 Sob o capô

- ✅ **Electron 39 + electron-vite + React 19 + TS** — stack moderna, hot-reload completo.
- ✅ **better-sqlite3 com migrations embedded** — schema versionado v1-v9, idempotente.
- ✅ **Provider registry** — abstração comum sobre Claude / Codex / Gemini / Aider / Ollama. Streaming + abort.
- ✅ **Tudo local** — diff nunca sai do device (exceto pra API IA do user).
- ✅ **API key do user** — DevSenses não paga IA por usuário. Roda com a tua chave.
- ✅ **Tema dark/light/auto** — segue OS por padrão, persistido.
- ✅ **8 themes de syntax highlighting** — Default / Dracula / Monokai / GitHub / One Dark / Tokyo Night / Nord / Solarized.
- ✅ **Tailwind v4** — design tokens via CSS vars, dark mode via `[data-theme]`.
- ✅ **Telemetria opt-in** — desligada por padrão. User decide.
- ✅ **PT-BR first** — interface em português, mensagens IA em PT.

---

## 📦 Lançamento

- ✅ **README hero + quickstart** — README reescrito com hero, features list, pitch, badges.
- ✅ **Landing page polish** — `web/` Next.js com sections atualizadas (hero / features / pricing) refletindo product real, PT + EN sincronizados.
- ✅ **Mac signing config** — `electron-builder.signed.yml` + `npm run build:mac:signed` env-driven, `SIGNING.md` com setup completo (local + GitHub Actions).
- ✅ **Launch copy templates** — `LAUNCH.md` com PH / HN / Reddit / Twitter thread / LinkedIn / demo script / timeline.
- ⏳ **Apple Developer Account + cert real** — pendente compra ($99/ano).
- ⏳ **GitHub Action de release auto-assinado** — workflow yml pronto em SIGNING.md, falta secrets.
- ⏳ **Build Windows + Linux** — scripts existem, falta testar.
- ⏳ **Product Hunt + HN + Reddit launch** — copy pronta em LAUNCH.md, falta executar.
- ⏳ **Multi-language UI (en, es)** (Pós-MVP)
- ⏳ **Export histórico → markdown/PDF** (Pós-MVP)
- ⏳ **Compartilhar explicação como link público anonimizado** (Pós-MVP)
- ⏳ **Plug-in VSCode (sidecar)** (Pós-MVP)
- ⏳ **Análise de PR inteiro (não só working tree)** (Pós-MVP)

---

## 🎤 Pitch curto pra landing

> **Tu deixou IA escrever. Deixa o DevSenses te ensinar o que ela fez.**
>
> Abre um repositório, edita arquivos (ou deixa Cursor/Copilot fazer), e o DevSenses lê o diff inteiro e te explica:
> - **No teu nível** (5 profundidades, do "pra criança" a "trade-offs algorítmicos")
> - **No teu tom** (5 personas, do mentor caloroso ao acadêmico rigoroso)
> - **Adaptando ao que tu já sabe** (mastery por conceito, quiz inteligente, auto-skip de tópicos dominados)
>
> Mais que explicação: testes pós-explicação, glossário pessoal que cresce, detecção automática de complexidade, cheat sheets sob ⌘K, modo Socrático que te força a pensar.
>
> Tudo local. Tua API key. Open source. PT-BR first.

---

## 📌 Como manter este arquivo atualizado

Toda vez que adicionar/remover/descartar feature:
1. Atualizar status do bullet aqui (✅ ⏳ ❌).
2. Se for feature nova de marketing, adicionar tagline curta.
3. Se for tecnicalidade, jogar em "Sob o capô".

A cada commit relevante de feature, atualizar **antes** de mover pro próximo trabalho.
