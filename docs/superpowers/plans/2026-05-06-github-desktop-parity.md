# DevSenses — Paridade GitHub Desktop + AI

**Data:** 2026-05-06
**Goal:** DevSenses substitui GitHub Desktop completamente. User abre 1 app só pra commitar, fazer fetch, mergear, push, abrir IDE, etc — com bônus de análise IA do diff.

**Estado base:** Fase 0 (fundação), Fase 1 (onboarding), Fase 2 (Diff Reviewer) e Fase 3 (Browser Tester) prontas. Esse plano é a **Fase 5 — Git Workspace**.

---

## 1. Princípios

- **Git nativo via simple-git ou exec direto** — nada de libgit2, sem dependência pesada.
- **IPC tipado** — todo handler git declarado em `ipc-contract.ts`.
- **UI inspirada no GH Desktop** mas com a estética DevSenses (mono, gray neutral, primary violet).
- **Cada fase entrega valor isolado** — se parar entre fases, o app fica utilizável.
- **Não comitar até concluir cada Task + critério de aceite** (regra do CLAUDE.md).

---

## 2. Mapa completo das features

### 2.1 Toolbar topo (3 zonas)

| zona | descrição | status |
|---|---|---|
| **Repository switcher** | dropdown com repos recentes + "Add Local" + "Clone" | ⚠️ existe mas simplificado |
| **Branch switcher** | dropdown com filter, default branch destacado, recent branches | ⚠️ existe simples |
| **Sync button** | Push / Pull / Fetch + badge `↑ N` (commits to push) `↓ M` (to pull) | ❌ |

### 2.2 Sidebar (tabs Changes / History)

| feature | status |
|---|---|
| Tab toggle Changes / History | ❌ (hoje só Changes) |
| Filter input (busca por nome de arquivo) | ❌ |
| Lista de arquivos modificados | ✅ |
| Status icon (M/A/D/R/C) | ⚠️ parcial |
| Checkbox por arquivo (stage/unstage) | ❌ |
| Master checkbox "selecionar tudo" | ❌ |
| **Double-click → abre no editor padrão** (VSCode/Cursor/etc) | ❌ |

### 2.3 Diff viewer (centro)

| feature | status |
|---|---|
| Sintaxe colorida | ✅ recém implementado (prism) |
| Numero de linhas | ✅ |
| Marcação +/- | ✅ |
| AI inline balloons | ✅ |
| **Ctrl+F / Cmd+F — busca local no diff** com highlight + N/N | ❌ |
| Checkbox por linha (stage parcial) | ❌ (G8) |
| Word wrap / no-wrap toggle | ⚠️ atualmente wrap forçado |

### 2.4 Painel IA (direita)

Mantém como está. Continua exibindo análise / Resumo / Detalhes / Conceitos.

### 2.5 Commit panel (rodapé sidebar)

| feature | status |
|---|---|
| Summary input (1ª linha do commit) | ❌ |
| Description textarea (corpo) | ❌ |
| Avatar do autor | ❌ |
| Botão Co-authors | ❌ low priority |
| Emoji picker | ❌ low priority |
| Botão "Commit to <branch>" | ❌ |
| Conventional commits helper (opcional, IA sugere) | 💡 ideia futura |

### 2.6 History tab (sidebar)

| feature | status |
|---|---|
| Lista de commits (autor + msg + data + hash) | ⚠️ existe parcial |
| Avatar | ❌ |
| Click em commit → diff exibido no centro | ⚠️ parcial |
| Compare commits (selecionar 2) | ❌ low priority |
| Filter | ❌ |

### 2.7 Branch operations

| operação | status |
|---|---|
| Switch | ✅ |
| New Branch (a partir de qualquer ref) | ❌ |
| Rename | ❌ |
| Delete local | ❌ |
| Delete remote | ❌ |
| Discard All Changes (working dir reset) | ❌ |
| Stash All | ❌ |
| Update from default (merge ou rebase do base na atual) | ❌ |
| Merge Into Current | ❌ |
| Squash and Merge | ❌ |
| Rebase Current | ❌ |
| Compare to Branch | ❌ low priority |
| Preview PR (abre URL compare) | ❌ |
| Create PR (abre URL compare) | ❌ |

### 2.8 Repository operations

| operação | status |
|---|---|
| Push (current → origin) | ❌ |
| Pull (fetch + merge) | ❌ |
| Fetch | ❌ |
| Force push (com confirmação dupla) | ❌ |
| View on GitHub (abre URL do remote) | ❌ |
| Open in Terminal | ❌ |
| Show in Finder | ❌ |
| **Open in Editor** (detect VSCode/Cursor/Sublime/IntelliJ + spawn) | ❌ |
| Create Issue (abre URL) | ❌ |
| Repository Settings (ver/editar remotes, default branch) | ❌ |
| Remove from app | ⚠️ via sidebar talvez |

### 2.9 File menu (criar repo)

| operação | status |
|---|---|
| New Repository (git init em pasta) | ❌ |
| Add Local Repository | ✅ |
| Clone Repository (URL → dest → git clone) | ❌ |

### 2.10 Conflict resolution

| feature | status |
|---|---|
| Detectar `.git/MERGE_HEAD` ou conflict markers | ❌ |
| Lista de arquivos conflitantes | ❌ |
| Marcar como resolvido (`git add`) | ❌ |
| Abort merge / abort rebase | ❌ |
| UI de side-by-side ours/theirs (opcional avançado) | ❌ |

### 2.11 Stash management

| feature | status |
|---|---|
| Stash all | ❌ |
| Listar stashes | ❌ |
| Pop / apply / drop | ❌ |

### 2.12 Settings (preferências)

| feature | status |
|---|---|
| Git user.name / user.email (global ou per-repo) | ❌ |
| Default editor (VSCode/Cursor/Sublime/IntelliJ) | ❌ |
| Default terminal (Terminal.app/iTerm/Warp) | ❌ |

### 2.13 Atalhos de teclado (matchando GH Desktop)

| atalho | ação |
|---|---|
| Cmd+1 | Show Changes |
| Cmd+2 | Show History |
| Cmd+T | Repository switcher |
| Cmd+B | Branches list |
| Cmd+N | New Branch |
| Cmd+P | Push |
| Cmd+Shift+P | Pull |
| Cmd+Shift+T | Fetch |
| Cmd+Shift+M | Merge Into Current |
| Cmd+Shift+E | Rebase Current |
| Cmd+Shift+U | Update from default |
| Cmd+Backspace | Discard / Delete |
| **Cmd+F** | Find in diff |
| **Duplo-clique no arquivo** | Open in editor |
| Cmd+R | Create PR |
| Cmd+G | Go to Summary (focus commit summary) |

---

## 3. Roadmap em fases

Cada fase = bloco entregável, comitado, testado manual. Tasks dentro da fase são executáveis em ordem.

### **Fase G1 — Commit & Push diário** ⭐ PRIORIDADE
**Goal:** user consegue editar → stage → commit → push sem sair do app.
**Effort:** 1-2 dias.

#### Tasks
- **G1.1** — IPC backend: `git:status`, `git:stageFiles`, `git:unstageFiles`, `git:commit`, `git:push`, `git:pull`, `git:fetch`, `git:aheadBehind` (count)
- **G1.2** — Sidebar Changes: checkbox por arquivo + master checkbox (selecionar tudo)
- **G1.3** — Status icon completo (M/A/D/R/C/U) com cor + tooltip
- **G1.4** — Commit panel rodapé sidebar: summary input (max 72 char + counter) + description textarea + botão "Commit to <branch>" (disabled se sem stage ou sem summary)
- **G1.5** — Toolbar Sync button: badge `↑N ↓M` puxando de `git:aheadBehind`. Click abre menu Push/Pull/Fetch
- **G1.6** — Confirmação modal antes de push em main/master
- **G1.7** — Toasts de feedback (commit ok, push ok, push falhou)

**Critério de aceite:** consigo editar 3 arquivos, marcar 2 pra stage, commitar com summary "test", e ver o commit aparecer no histórico do git remoto após push.

---

### **Fase G2 — Quick wins shell/URL** 🚀 fácil + alto impacto
**Goal:** Open in IDE / Terminal / Finder / GitHub.
**Effort:** ½ dia.

#### Tasks
- **G2.1** — Detector de editores instalados (VSCode/Cursor/Sublime/WebStorm/IntelliJ): scan `which code`, `which cursor`, `/Applications/*.app`. IPC `editors:detect`.
- **G2.2** — IPC `repository:openInEditor`, `repository:openInTerminal`, `repository:openInFinder`, `repository:openOnGitHub` (lê origin URL, transforma git@→https)
- **G2.3** — UI: botões na toolbar repository (icon menu `…` → ações)
- **G2.4** — **Duplo-clique em arquivo da sidebar Changes** → abre arquivo no editor padrão (config em settings)
- **G2.5** — Settings: seção "Editor padrão" (radio dos detectados)

**Critério de aceite:** duplo-clique em `index.tsx` abre VSCode/Cursor com o arquivo aberto na linha correta (se possível).

---

### **Fase G3 — Find in Diff (Cmd+F)** 🔍
**Goal:** busca dentro do diff.
**Effort:** ½ dia.

#### Tasks
- **G3.1** — Componente `<DiffSearchBar>` flutuante (igual VSCode): input + N/N counter + botões prev/next + close
- **G3.2** — Hook `useDiffSearch(text, query)` retorna lista de matches `{lineIdx, charStart, charEnd}`
- **G3.3** — Highlight de matches no DiffViewer (wrap match em `<mark>`)
- **G3.4** — Match atual destacado mais forte (bg-primary)
- **G3.5** — Atalho Cmd+F abre, Esc fecha, Enter próximo, Shift+Enter anterior
- **G3.6** — Auto-scroll pro match atual

**Critério de aceite:** Cmd+F abre barra. Digito "useEffect" → mostra "1/12 matches". Enter pula pro próximo. Esc fecha.

---

### **Fase G4 — Branch ops** 🌿
**Goal:** criar/deletar/mergear branches.
**Effort:** 1-2 dias.

#### Tasks
- **G4.1** — IPC: `git:createBranch`, `git:deleteBranch`, `git:renameBranch`, `git:mergeBranch`, `git:rebaseBranch`, `git:discardAll`, `git:discardFile`, `git:stash`, `git:stashList`, `git:stashPop`
- **G4.2** — Branch switcher dropdown estilo GH: filter input + "Default Branch" + "Recent Branches" + "Other Branches"
- **G4.3** — Dialog "New Branch": nome (validar ascii/dash) + base ref (default = HEAD) + checkbox "publicar"
- **G4.4** — Dialog "Merge Into Current Branch": filter + lista + selecionar + "Create a merge commit" (com dropdown squash/rebase)
- **G4.5** — Dialog "Rename Branch": novo nome + renomeia local + (se publicada) confirma renomear remote
- **G4.6** — Dialog "Discard All Changes": confirmação + opção "stash em vez de discardar"
- **G4.7** — Menu de contexto na branch list: New / Rename / Delete / Merge Into / Rebase Onto / View on GitHub
- **G4.8** — "Update from <default>" — botão que faz merge ou rebase do default na atual (config no settings: prefere merge ou rebase)

**Critério de aceite:** crio branch `test`, faço commit, mergeio em `dev`, deleto `test`, tudo via UI sem terminal.

---

### **Fase G5 — Pull Request (abre URL)** 🔗
**Goal:** preparar PR sem sair do app, mas sem reimplementar GitHub.
**Effort:** ¼ dia.

#### Tasks
- **G5.1** — Detectar URL do remote (origin), montar `https://github.com/<owner>/<repo>/compare/<base>...<head>`
- **G5.2** — Botão "Create Pull Request" no toolbar quando branch não-default
- **G5.3** — Botão "Preview PR" — também abre compare URL
- **G5.4** — Botão "View on GitHub" no menu repository
- **G5.5** — Botão "Create Issue" → abre `/issues/new`

**Critério de aceite:** click em "Create Pull Request" abre browser na URL compare correta com base e head preenchidos.

---

### **Fase G6 — History upgrade** 📜
**Goal:** aba History tipo GH Desktop.
**Effort:** ½ dia.

#### Tasks
- **G6.1** — Tab toggle Changes / History no topo da sidebar
- **G6.2** — IPC `git:log` extendido com author email, hash, date, refs (tags/branches)
- **G6.3** — Lista de commits: avatar (gravatar do email) + summary + author + relative date
- **G6.4** — Click em commit → carrega diff do commit no centro + AI panel mostra análise (já existe)
- **G6.5** — Filter input
- **G6.6** — Action menu por commit: Revert, Cherry-pick, View on GitHub, Copy SHA

**Critério de aceite:** vejo lista de 50 commits, clico no de 3 dias atrás, vejo o diff completo + análise IA.

---

### **Fase G7 — Clone & Init** 📥
**Goal:** clonar repo via URL.
**Effort:** ½ dia.

#### Tasks
- **G7.1** — IPC `git:clone(url, destDir)` + `git:init(dir)`
- **G7.2** — Dialog "Clone Repository": URL input + dest folder picker + botão clone (loader durante)
- **G7.3** — Dialog "New Repository": dest folder (vazio) + initial branch name + commit inicial opcional
- **G7.4** — Adicionar entradas File menu (Cmd+N / Cmd+Shift+O / Cmd+O)
- **G7.5** — Após clone/init, abre o repo automaticamente

**Critério de aceite:** clico Clone, colo URL, escolho pasta, app clona e abre o repo.

---

### **Fase G8 — Conflict resolution** ⚠️
**Goal:** detectar + resolver merge conflicts no app.
**Effort:** 1 dia.

#### Tasks
- **G8.1** — Detector: lê `.git/MERGE_HEAD`, `MERGE_MSG`, `git status --porcelain` looking for `UU/AA/DD`
- **G8.2** — Banner topo "Você está no meio de um merge — N arquivos conflitantes"
- **G8.3** — Lista de arquivos conflitantes (vermelho)
- **G8.4** — Diff viewer mostra conflict markers `<<<<<<< HEAD` etc highlighted
- **G8.5** — Botão "Marcar resolvido" por arquivo (`git add`)
- **G8.6** — Botão "Continuar merge" (commit) quando todos resolvidos
- **G8.7** — Botão "Abortar merge" sempre disponível

**Critério de aceite:** induzo conflito, app detecta, edito arquivo manualmente, marco resolved, continuo merge — tudo no app.

---

### **Fase G9 — Stash management** 📦
**Goal:** gerenciar stashes.
**Effort:** ¼ dia.

#### Tasks
- **G9.1** — Botão "Stash" no toolbar quando tem changes
- **G9.2** — Tab/seção "Stashed Changes" na sidebar
- **G9.3** — Lista stashes com msg + date
- **G9.4** — Por stash: Apply / Pop / Drop / View diff

**Critério de aceite:** stash 5 mudanças, vejo na lista, dou pop, recuperam.

---

### **Fase G10 — Settings expansion** ⚙️
**Goal:** preferências git/editor/terminal.
**Effort:** ½ dia.

#### Tasks
- **G10.1** — Settings → "Git" seção: user.name + user.email (lê do `git config --global` no carregar, salva no `--local` do repo se override)
- **G10.2** — Settings → "Apps externos": editor padrão (radio dos detectados) + terminal padrão (Terminal/iTerm/Warp)
- **G10.3** — Settings → "Branch": "Update from default" usa merge ou rebase (radio)

**Critério de aceite:** mudo editor pra Cursor, duplo-clique em arquivo abre no Cursor.

---

### **Fase G11 — Per-line/hunk staging** 🔬 (avançado)
**Goal:** stage parcial por linha igual GH Desktop.
**Effort:** 1-2 dias.

#### Tasks
- **G11.1** — Checkbox por linha no DiffViewer
- **G11.2** — Cálculo do patch parcial (subset de hunks selecionados)
- **G11.3** — `git apply --cached` com o patch construído
- **G11.4** — Sync state com index do git (refresh status após cada toggle)
- **G11.5** — Edge cases: linha context, deletion-only line, file rename

**Critério de aceite:** num arquivo com 20 linhas alteradas, marco apenas 5, commit incluí só essas 5.

---

## 4. Estrutura de arquivos prevista

```
src/main/
├── git/
│   ├── service.ts           # já existe
│   ├── ops.ts               # NOVO — stage/commit/push/pull/fetch
│   ├── branches.ts          # NOVO — create/delete/rename/merge/rebase
│   ├── stash.ts             # NOVO — G9
│   ├── conflicts.ts         # NOVO — G8
│   └── remote.ts            # NOVO — push/pull/fetch/ahead-behind
├── system/
│   └── editors.ts           # NOVO — detect VSCode/Cursor/Sublime, spawn
├── ipc/
│   ├── git-ops.ts           # NOVO
│   ├── repository.ts        # NOVO — open in editor/terminal/finder
│   └── editors.ts           # NOVO

src/renderer/src/pages/Project/
├── index.tsx                # principal — refator
├── components/
│   ├── ChangesTab.tsx       # NOVO — sidebar Changes
│   ├── HistoryTab.tsx       # NOVO — sidebar History
│   ├── CommitPanel.tsx      # NOVO — rodapé sidebar
│   ├── BranchSwitcher.tsx   # NOVO — dropdown estilo GH
│   ├── SyncButton.tsx       # NOVO — Push/Pull/Fetch toolbar
│   ├── DiffSearchBar.tsx    # NOVO — Cmd+F
│   └── dialogs/
│       ├── NewBranchDialog.tsx
│       ├── MergeIntoDialog.tsx
│       ├── DiscardAllDialog.tsx
│       ├── CloneDialog.tsx
│       └── RepositorySettingsDialog.tsx

src/shared/
└── ipc-contract.ts          # adicionar todos os novos canais
```

---

## 5. Order de execução sugerida

### Sprint 1 (uso diário, ~2 dias)
1. **G1** Commit & Push
2. **G2** Quick wins (open in editor, terminal, finder, github)
3. **G3** Find in Diff

→ **Marco:** posso usar DevSenses como GH Desktop pra commitar e pushar diariamente.

### Sprint 2 (branch flow, ~1.5 dias)
4. **G4** Branch ops
5. **G5** Pull Request links

→ **Marco:** criar feature branch, mergear, abrir PR sem sair.

### Sprint 3 (polish, ~1.5 dias)
6. **G6** History upgrade
7. **G7** Clone & Init
8. **G10** Settings expansion

### Sprint 4 (situational, ~1.5 dias)
9. **G8** Conflicts
10. **G9** Stash
11. **G11** Per-line staging (último, mais complexo)

**Total estimado:** ~7 dias dev focado. Sprint 1+2 entrega 80% do uso real (~3.5 dias).

---

## 6. Riscos / pontos de atenção

- **Push/pull com SSH key** — precisa que o usuário tenha SSH agent rodando ou HTTPS+token. Não vamos gerenciar credenciais — assumir que `git push` no terminal já funciona.
- **GitHub Auth (OAuth)** — não pretendemos. Tudo via git CLI + abrir browser pra ações que precisam de auth.
- **Conflict resolver visual** — versão simples (markers no diff). Side-by-side seria fase futura.
- **Performance em repos grandes** — `git log` precisa ser paginado (default 50, scroll carrega mais).
- **Hot keys conflitam com Electron padrão** — Cmd+R = reload, Cmd+W = close. Usar Cmd+R só na Project page com `preventDefault`.
- **simple-git lib** — já tá em deps mas pouco usado. Considerar trocar por execa direto (mais controle, menos deps).

---

## 7. Decisões pendentes (perguntar antes de começar)

1. **Conventional commits helper na summary?** Templates tipo `feat(scope): ...` com IA sugerindo prefix?
2. **Suporte a múltiplas pastas abertas simultâneo?** GH Desktop tem 1 só. DS já tem recents.
3. **GitHub API integration (PR review, comments)?** Fora de scope inicial, reabrir depois.
4. **Notifications system tray?** "Push successful" como toast in-app já basta?
5. **Auto-fetch periódico?** GH Desktop faz a cada 10min. Implementar com flag on/off no settings?

---

## 8. Definição de pronto (DoD por fase)

Cada fase só fecha quando:
- [ ] Critério de aceite manual passou
- [ ] `npm run typecheck` limpo
- [ ] `npm run lint` limpo
- [ ] Smoke test do flow completo
- [ ] Sem warnings no DevTools renderer
- [ ] README atualizado mencionando feature
- [ ] User aprova visualmente

---

## 9. Próxima ação

User revisa esse plano. Confirma:
- Order das fases tá ok?
- Algum item pra adicionar/remover/repriorizar?
- Decisões da seção 7 — definir antes de começar?

Quando confirmado, abro Task 1 (G1.1 — IPC backend) e seguimos.
