# Contribuindo com o DevSenses

Valeu por querer ajudar! O DevSenses é open source e PT-BR first. Este guia tem o
essencial pra tu rodar local, abrir uma issue ou mandar um PR.

## TL;DR

```bash
git clone https://github.com/Luccas-carvalho/DevSenses.git
cd DevSenses
npm install
npm run dev
```

Antes de abrir PR: `npm run typecheck` e `npm run lint` têm que passar.

## Pré-requisitos

- **Node.js 20+** (o app empacota com Electron 39).
- **npm** (o repo usa `package-lock.json`).
- Pelo menos um provider de IA no PATH pra testar o fluxo: `claude`, `codex`,
  `gemini`, `aider` ou `ollama` (BYOK — a chave/credencial é tua).
- macOS / Windows / Linux pra dev; builds de release por plataforma (ver README).

## Rodando local

```bash
npm run dev          # app em modo dev (electron-vite)
npm run typecheck    # tsc node + web (gate obrigatório)
npm run lint         # eslint + prettier
npm test             # vitest (lógica pura)
npm run build:mac:arm64   # build .dmg local (ou :win / :linux)
```

## Fluxo de contribuição

1. **Bug pequeno / fix óbvio:** manda PR direto.
2. **Feature nova / mudança de comportamento:** abre uma **issue** antes pra
   alinhar escopo (o DevSenses é focado — tutor educacional de diff, **não** é git
   client nem IDE; PRs que fogem disso provavelmente não entram).
3. Faz um fork, cria a branch, implementa, abre o PR contra `main`.

### Nome de branch

Inglês, com prefixo + descrição curta:

- `feat/` — feature nova
- `fix/` — correção
- `hotfix/` — bug crítico
- `chore/` — manutenção
- `docs/` — documentação

Ex.: `feat/quiz-export`, `fix/diff-empty-state`.

## Padrões de código

O guia técnico completo está no [`CLAUDE.md`](CLAUDE.md). Resumo:

- **Frontend:** React 19 + Tailwind v4. Condicionais via `cn({ 'classe': cond })`.
  Stores Zustand em `src/renderer/src/stores/`. Componentes UI em
  `components/ui/`.
- **Ícones:** `lucide-react`. **Zero emoji na UI** — sempre ícone.
- **Backend (Electron main):** repositories em `src/main/repositories/`, handlers
  IPC em `src/main/ipc/` (registrar no `index.ts`), AI generators em `src/main/ai/`
  sempre com timeout + abort signal. Migrations idempotentes e versionadas em
  `src/main/db/migrations.ts`.
- **IPC:** toda mudança passa pelo contrato em `src/shared/ipc-contract.ts` (o TS
  check pega quebras).
- **Tipos:** nada de `any` sem `// reason:`.
- **Sem** `console.log` esquecido, sem dead code. Comentário só pra "porquê" não óbvio.
- **PT-BR** em tudo que é user-facing (UI, mensagens, prompts de IA, comentários
  significativos).

### Atualizar o FEATURES.md

Mexeu numa **feature visível pro usuário** (entregou/removeu/alterou)? Atualiza o
[`FEATURES.md`](FEATURES.md) no mesmo PR (✅ entregue / ⏳ backlog / ❌ descartado).
É o source-of-truth do que o app faz.

## Checklist do PR

- [ ] `npm run typecheck` passa (node + web).
- [ ] `npm run lint` passa (sem erro novo).
- [ ] `FEATURES.md` atualizado, se mexeu em feature visível.
- [ ] Screenshot/gif, se mudou UI.
- [ ] Nenhum secret/credencial commitado; nada de `.env`.
- [ ] UI sem emoji; textos user-facing em PT-BR.

## Reportando bug

Use o template de issue. Ajuda muito incluir: SO, provider de IA usado, passos pra
reproduzir e — quando der — um **diff pequeno que reproduz** o problema.

## Segurança

Achou uma vulnerabilidade? **Não** abra issue pública — siga o
[`SECURITY.md`](SECURITY.md).

## Conduta

Ao participar, tu concorda com o [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
