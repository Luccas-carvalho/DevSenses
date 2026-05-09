# DevSenses — Instruções pro Claude Code

> **IDIOMA**: Sempre responda em português. Sem exceções.

> **NUNCA COMMITAR.** Não rodar `git commit`, `git add`, `git push`, `git reset`, `git checkout` em arquivos, ou qualquer comando que mexa no estado do git. Quem commita é o Luccas. Esta regra sobrepõe qualquer skill (brainstorming, executing-plans, finishing-branch, etc).

> **NOMES DE BRANCH**: Ao pedir nome de branch, analisar o que foi feito e sugerir em inglês com prefixo: `feat/` (feature nova), `fix/` (correção), `hotfix/` (bug crítico), `chore/` (manutenção), `docs/` (docs). Formato: `prefixo/descricao-curta-em-ingles`.

---

## Sobre o projeto

DevSenses é um **tutor de IA pra explicar diff de código**. Electron + React 19 + TS + better-sqlite3. Foco 100% educacional — NÃO é git client, NÃO é IDE.

Tudo local. API key do user. Open source. PT-BR first.

Stack:
- `src/main/` — Electron main process (DB, IPC, providers, AI generators)
- `src/renderer/` — React UI (Tailwind v4, Zustand stores, Lucide icons)
- `src/shared/` — types compartilhados (settings, providers, IPC contract)
- `build/` — assets de build (icon, dmg-background, entitlements)

---

## ⚠️ Regra crítica: FEATURES.md

Toda vez que entregar/remover/mexer numa **feature visível pro user**:

1. Abrir `FEATURES.md` na raiz.
2. Atualizar o checkbox correspondente (✅ entregue / ⏳ backlog / ❌ descartado).
3. Se for feature nova: adicionar bullet com tagline curta de marketing na categoria certa.
4. Se for technical-only (refactor, infra, etc): jogar em "Sob o capô".
5. Fazer isso **antes** de partir pro próximo trabalho — não acumular.

Esse arquivo serve de:
- Source-of-truth do que existe.
- Referência pra landing page / Product Hunt / README hero.
- Memória do que mudou ao longo do tempo.

Categorias atuais:
- 🚀 Primeira impressão (onboarding)
- 🧠 Núcleo educacional (explicação, tom, profundidade)
- 🎯 Aprendizado adaptativo (quiz, mastery, glossário)
- ⚡ Power tools sobre o diff (cheat sheet, big-O, what-if)
- 🎨 Polish & UX (animações, transições, microinterações)
- 🔧 Sob o capô (stack, infra)
- 📦 Lançamento (backlog de release)

Se a categoria não couber, criar nova com emoji + título.

---

## Outros .md de planejamento

- `MVP_PLAN.md` — sprints 1-4 com escopo + estimativas.
- `SPRINT_1_PLAN.md` — detalhe técnico do sprint 1 (já entregue).
- `ONBOARDING_REVAMP_PLAN.md` — referência do polish portado do orkestral.
- `COMMANDS.md` — comandos úteis (build dmg, dev, regenerate icon).

---

## Padrões de código

### Frontend
- Tailwind v4 — classes em `cn(...)` com objeto `{ 'class': cond }` pra condicionais.
- Hooks customizados em `src/renderer/src/hooks/`.
- Stores Zustand colocais em `src/renderer/src/stores/`.
- Componentes UI em `src/renderer/src/components/ui/` (Tooltip, ContextMenu, button, card, etc).
- Componentes domínio em `src/renderer/src/components/analysis/`, `git/`, etc.
- Icons: lucide-react. NUNCA emoji em UI (usar icons sempre).
- Tipos: NEVER `any` sem `// reason:` comment.

### Backend (Electron main)
- Repositories em `src/main/repositories/` — uma classe por entidade.
- IPC handlers em `src/main/ipc/` — registrar em `index.ts`.
- AI generators em `src/main/ai/` — sempre com timeout + abort signal.
- Migrations idempotentes em `src/main/db/migrations.ts` (versionadas).
- IPC contract em `src/shared/ipc-contract.ts` — toda mudança de IPC tem que passar pelo contract pra TS check pegar.

### Comum
- Sem `console.log` deixados em código (apenas dev).
- Sem dead code.
- Comentários só pra "WHY" não óbvio.
- Tradução: tudo user-facing em português.

---

## Comandos úteis

```bash
# Dev
npm run dev

# Type check
npx tsc --noEmit -p tsconfig.web.json   # renderer
npx tsc --noEmit -p tsconfig.node.json  # main

# Build mac arm64
npm run build:mac:arm64

# Eject volumes Finder cache (antes de testar DMG novo)
for v in /Volumes/DevSenses*; do hdiutil detach "$v" -force; done
rm -rf release/
```

---

## Quando estiver em dúvida

1. **Não commitar nada** — pedir antes.
2. **Não pivotar escopo** — DevSenses é educacional, não git client.
3. **Verificar FEATURES.md antes de declarar "done"** — atualizar antes de seguir.
4. **Nada de mock em testes que importam** — preferir teste real.
5. **PT-BR sempre** — interface, mensagens, prompts IA, comentários significativos.
