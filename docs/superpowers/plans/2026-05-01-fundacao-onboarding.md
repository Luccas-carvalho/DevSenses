# DevSenses — Fundação + Onboarding (Fase 0 + Fase 1)

> **Para agentes (codex/claude/etc.):** Cada Task abaixo é um prompt independente. Execute em ordem, do Task 1 ao Task 21. Use checkbox `- [ ]` pra marcar progresso. Ao terminar uma task, valide o critério de aceite antes de seguir.

> **REGRA CRÍTICA:** O usuário (Luccas) nunca deve ver código quebrado. Cada Task termina com a aplicação rodando. Cada commit é atômico — se algo quebra no meio, NÃO commita.

**Goal:** Construir o esqueleto do app desktop DevSenses (Electron + Vite + React + TS + Tailwind + shadcn + SQLite) e o onboarding completo de 8 passos com persistência de configuração.

**Architecture:** App desktop Electron com 2 processos: `main` (Node.js — file system, SQLite, subprocess de CLIs IA, file watcher) e `renderer` (Chromium + React — UI). Comunicação tipada via IPC com `contextBridge` no preload. SQLite é a única persistência (`~/.devsenses/devsenses.db`). UI usa shadcn/ui sobre Tailwind v4 com tema dark/light/auto. Onboarding é uma SPA interna (React Router) com 8 steps; ao concluir, app entra na home (placeholder até Fase 2 — Diff Reviewer).

**Tech Stack:**
- Electron 33+ via `electron-vite` (template `@quick-start/electron`)
- React 18 + TypeScript 5.7
- Vite 6 (já embutido no electron-vite)
- Tailwind CSS 4 (CSS-first config)
- shadcn/ui (Radix primitives copiados pro repo)
- Lucide React (ícones)
- React Router DOM 7
- Framer Motion 12 (animações sutis)
- better-sqlite3 11+ (persistência)
- chokidar 4 (file watcher — preparado pra Fase 2, instalado já)
- simple-git 3 (preparado pra Fase 2)
- Vitest 2 (testes unidade)
- electron-builder 25+ (empacotamento DMG/EXE)

---

## Estrutura de Arquivos

Estrutura definitiva pós-Fase 1. Cada arquivo tem responsabilidade única.

```
DevSenses/
├── src/
│   ├── main/                          # Processo Electron main (Node.js)
│   │   ├── index.ts                   # Entry point — cria BrowserWindow, registra IPC
│   │   ├── ipc/
│   │   │   ├── index.ts               # Registra todos handlers IPC
│   │   │   ├── settings.ts            # Handlers: settings:get, settings:set, settings:all
│   │   │   ├── providers.ts           # Handlers: providers:detect, providers:test, providers:invoke
│   │   │   └── workspace.ts           # Handlers: workspace:pickFolder, workspace:recent
│   │   ├── db/
│   │   │   ├── connection.ts          # Singleton better-sqlite3
│   │   │   ├── migrations.ts          # Runner sequencial de migrations
│   │   │   └── migrations/
│   │   │       ├── 001_initial.sql    # settings + recent_workspaces + concept tables (placeholder)
│   │   │       └── 002_seen_concepts.sql  # tabelas Fase 2 placeholders (vazias por ora)
│   │   ├── repositories/
│   │   │   └── settings.ts            # SettingsRepository (CRUD)
│   │   ├── providers/
│   │   │   ├── types.ts               # interface AIProvider, types compartilhados
│   │   │   ├── registry.ts            # array dos 5 providers
│   │   │   ├── detect.ts              # `which` cross-platform
│   │   │   ├── claude.ts              # ClaudeProvider
│   │   │   ├── codex.ts               # CodexProvider
│   │   │   ├── gemini.ts              # GeminiProvider
│   │   │   ├── aider.ts               # AiderProvider
│   │   │   └── ollama.ts              # OllamaProvider
│   │   └── utils/
│   │       └── paths.ts               # `~/.devsenses/` resolvers
│   │
│   ├── preload/                       # Bridge segura main↔renderer
│   │   └── index.ts                   # contextBridge.exposeInMainWorld('api', ...)
│   │
│   ├── renderer/                      # SPA React (Vite)
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx               # Entry React
│   │   │   ├── App.tsx                # Router + ThemeProvider
│   │   │   ├── routes.tsx             # Definição rotas
│   │   │   ├── pages/
│   │   │   │   ├── Onboarding/
│   │   │   │   │   ├── index.tsx      # Shell (layout + progress + navegação)
│   │   │   │   │   └── steps/
│   │   │   │   │       ├── Welcome.tsx
│   │   │   │   │       ├── Name.tsx
│   │   │   │   │       ├── Seniority.tsx        # manual ou quiz
│   │   │   │   │       ├── SeniorityQuiz.tsx    # 8 perguntas adaptativas
│   │   │   │   │       ├── ProviderDetect.tsx
│   │   │   │   │       ├── ProviderTest.tsx
│   │   │   │   │       ├── Theme.tsx
│   │   │   │   │       ├── Workspace.tsx
│   │   │   │   │       └── Summary.tsx
│   │   │   │   ├── Home/
│   │   │   │   │   └── index.tsx       # placeholder Fase 2
│   │   │   │   └── Settings/
│   │   │   │       ├── index.tsx
│   │   │   │       ├── Profile.tsx
│   │   │   │       ├── AI.tsx
│   │   │   │       ├── Appearance.tsx
│   │   │   │       └── Workspace.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                 # shadcn components (gerados via CLI)
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── progress.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── radio-group.tsx
│   │   │   │   │   ├── label.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   └── alert.tsx
│   │   │   │   ├── ThemeProvider.tsx
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   ├── OnboardingProgress.tsx
│   │   │   │   └── ProviderCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSettings.ts      # SWR-like wrapper sobre IPC
│   │   │   │   ├── useTheme.ts
│   │   │   │   ├── useOnboardingState.ts  # zustand store
│   │   │   │   └── useProviders.ts
│   │   │   ├── stores/
│   │   │   │   └── onboarding.ts       # zustand
│   │   │   ├── lib/
│   │   │   │   ├── cn.ts               # clsx + tailwind-merge
│   │   │   │   ├── api.ts              # wrappers tipados sobre window.api
│   │   │   │   └── quiz.ts             # banco de perguntas seniority quiz
│   │   │   └── styles/
│   │   │       └── globals.css         # Tailwind v4 directives + CSS vars tema
│   │   └── tsconfig.json
│   │
│   └── shared/                         # Tipos compartilhados main + renderer
│       ├── ipc-contract.ts             # Interfaces IPC (request/response)
│       ├── settings.ts                 # SettingsKey, SettingValue
│       ├── seniority.ts                # SeniorityLevel enum + helpers
│       └── providers.ts                # ProviderId, ProviderStatus
│
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── package.json
├── components.json                     # shadcn config
├── vitest.config.ts
├── tests/
│   ├── main/
│   │   ├── repositories/settings.test.ts
│   │   ├── providers/detect.test.ts
│   │   └── db/migrations.test.ts
│   └── shared/
│       └── seniority.test.ts
├── resources/                          # Ícones, assets build
│   ├── icon.png
│   ├── icon.ico                        # windows
│   └── icon.icns                       # mac
├── docs/superpowers/plans/
│   └── 2026-05-01-fundacao-onboarding.md   # este arquivo
├── .gitignore
├── .editorconfig
├── README.md
└── CLAUDE.md                           # instruções pra IAs trabalhando no repo
```

---

## Esquema SQLite Inicial

Migration `001_initial.sql`:

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,                   -- JSON serializado
  updated_at INTEGER NOT NULL            -- unix ms
);

CREATE TABLE IF NOT EXISTS recent_workspaces (
  path TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  last_opened_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS recent_workspaces_last_opened_idx
  ON recent_workspaces (last_opened_at DESC);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
);
```

Chaves `settings` usadas Fase 1 (cada chave 1 linha):

| key | value (JSON) | descrição |
|-----|--------------|-----------|
| `onboarding_completed` | `boolean` | true após Step 8 |
| `user_name` | `string` | nome do dev |
| `seniority` | `"intern"\|"junior"\|"mid"\|"senior"` | nível |
| `seniority_source` | `"manual"\|"quiz"` | como foi setado |
| `provider_default` | `"claude"\|"codex"\|"gemini"\|"aider"\|"ollama"` | CLI escolhido |
| `provider_tested` | `Record<ProviderId, boolean>` | quais passaram no test |
| `theme` | `"dark"\|"light"\|"auto"` | tema |
| `last_workspace` | `string \| null` | path última pasta aberta |
| `professor_turbo` | `boolean` | toggle global Fase 2 (default false) |

Migration `002_seen_concepts.sql` (placeholder Fase 2 — cria estrutura mas vazia, evita migration breaking change depois):

```sql
CREATE TABLE IF NOT EXISTS concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT,
  framework TEXT,
  UNIQUE(name, language, framework)
);

CREATE TABLE IF NOT EXISTS user_seen_concepts (
  concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  first_seen_at INTEGER NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  marked_learned INTEGER NOT NULL DEFAULT 0,  -- bool
  PRIMARY KEY (concept_id)
);
```

---

## Contrato IPC

`src/shared/ipc-contract.ts` define todos handlers. Tipo `IpcChannels` mapeia channel → request/response. Renderer consome via `window.api.X`.

```ts
import type { ProviderId, ProviderStatus } from './providers'
import type { SettingsKey, SettingsValueMap } from './settings'

export interface IpcContract {
  // Settings
  'settings:get': {
    request: { key: SettingsKey }
    response: SettingsValueMap[SettingsKey] | null
  }
  'settings:set': {
    request: { key: SettingsKey; value: SettingsValueMap[SettingsKey] }
    response: void
  }
  'settings:all': {
    request: void
    response: Partial<SettingsValueMap>
  }

  // Providers
  'providers:detect': {
    request: void
    response: Record<ProviderId, { installed: boolean; binaryPath: string | null; version: string | null }>
  }
  'providers:test': {
    request: { id: ProviderId }
    response: { ok: boolean; latencyMs: number; error: string | null }
  }
  'providers:invoke': {
    request: { id: ProviderId; prompt: string; streamId: string }
    response: void   // streaming via 'providers:stream' event
  }

  // Workspace
  'workspace:pickFolder': {
    request: void
    response: { path: string; name: string } | null
  }
  'workspace:recent': {
    request: void
    response: Array<{ path: string; name: string; lastOpenedAt: number }>
  }
}

// Eventos main → renderer (não-request/response)
export interface IpcEvents {
  'providers:stream': { streamId: string; chunk: string; done: boolean; error: string | null }
}

export type IpcChannel = keyof IpcContract
export type IpcRequest<C extends IpcChannel> = IpcContract[C]['request']
export type IpcResponse<C extends IpcChannel> = IpcContract[C]['response']
```

`window.api` exposto pelo preload é tipado:

```ts
declare global {
  interface Window {
    api: {
      invoke<C extends IpcChannel>(channel: C, payload: IpcRequest<C>): Promise<IpcResponse<C>>
      on<E extends keyof IpcEvents>(event: E, listener: (data: IpcEvents[E]) => void): () => void
    }
  }
}
```

---

## Convenções

- **Commits:** Conventional Commits PT-BR. Prefixos: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`. Mensagem no imperativo.
- **Nunca usar `any`** sem comentário `// reason: <motivo>`.
- **Sem console.log** no código. Use `console.error` só pra erros realmente excepcionais.
- **TDD onde dá:** repositories, providers, migrations, helpers. UI testa manualmente (Playwright vem na Fase 3).
- **Cada Task termina com app rodando** (`npm run dev` abre a janela sem erro). Se quebrar, NÃO commita.

---

# FASE 0 — FUNDAÇÃO

Tasks 1–9. Sem isso, onboarding não roda.

---

### Task 1: Inicializar projeto electron-vite + React + TS

**Files:**
- Create: tudo no diretório raiz (estrutura template)
- Modify: `package.json` (renomear pra `devsenses`)

- [ ] **Step 1: Rodar generator do template**

Estando em `/Users/luccas/Documents/Github/DevSenses` (vazio exceto `.git/` e `docs/`):

```bash
cd /Users/luccas/Documents/Github/DevSenses
npm create @quick-start/electron@latest . -- --template react-ts --skip
```

Se o CLI perguntar algo interativo:
- "project name" → `devsenses`
- "Add Electron updater plugin?" → `No`
- "Enable Electron download mirror proxy?" → `No`

Se a flag `--skip` não suprimir prompts no template atual, responder manualmente acima.

- [ ] **Step 2: Renomear no package.json**

Editar `package.json`:

```json
{
  "name": "devsenses",
  "version": "0.0.1",
  "description": "DevSenses — IDE com IA educacional",
  "main": "./out/main/index.js",
  "author": "Luccas Carvalho",
  "homepage": "https://github.com/Luccas-carvalho/DevSenses",
  ...
}
```

- [ ] **Step 3: Instalar dependências**

```bash
npm install
```

Esperado: instala sem erro. Pode demorar (Electron baixa ~100MB).

- [ ] **Step 4: Rodar dev**

```bash
npm run dev
```

Esperado: janela Electron abre com a tela default do template ("electron-vite" splash). Fechar janela.

- [ ] **Step 5: Criar `.gitignore` adicionando paths que faltam**

O template já cria um. Conferir e garantir que contém:

```
node_modules/
out/
dist/
*.log
.DS_Store
.vscode/.tmp
.env.local
```

- [ ] **Step 6: Criar `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 7: Criar README.md mínimo**

```markdown
# DevSenses

IDE desktop com IA educacional. Pega seus diffs do git, explica o que foi feito conforme seu nível de senioridade e ensina os conceitos por trás. Roda CLIs IA que você já tem instaladas (claude, codex, gemini, aider, ollama).

## Status

Em desenvolvimento — Fase 0 (Fundação) + Fase 1 (Onboarding).

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
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffold electron-vite + react + ts"
```

**Critério aceite:** `npm run dev` abre janela sem erro. `git log` mostra 1 commit.

---

### Task 2: Configurar Tailwind v4 + shadcn/ui + Lucide

**Files:**
- Create: `src/renderer/src/styles/globals.css`
- Create: `components.json` (shadcn)
- Modify: `src/renderer/index.html` (importar CSS global)
- Modify: `src/renderer/src/main.tsx` (importar CSS)
- Modify: `electron.vite.config.ts` (alias `@/` → `src/renderer/src`)
- Modify: `tsconfig.web.json` (paths)

- [ ] **Step 1: Instalar Tailwind v4**

```bash
npm install -D tailwindcss@^4 @tailwindcss/vite
npm install clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Configurar plugin Vite**

Editar `electron.vite.config.ts` — bloco do renderer:

```ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
```

- [ ] **Step 3: Criar `src/renderer/src/styles/globals.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0.02 270);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.15 0.02 270);
  --color-primary: oklch(0.55 0.2 285);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.96 0.01 270);
  --color-secondary-foreground: oklch(0.2 0.02 270);
  --color-muted: oklch(0.96 0.01 270);
  --color-muted-foreground: oklch(0.55 0.02 270);
  --color-accent: oklch(0.96 0.01 270);
  --color-accent-foreground: oklch(0.2 0.02 270);
  --color-destructive: oklch(0.62 0.22 25);
  --color-destructive-foreground: oklch(0.99 0 0);
  --color-border: oklch(0.92 0.01 270);
  --color-input: oklch(0.92 0.01 270);
  --color-ring: oklch(0.55 0.2 285);
  --radius: 0.625rem;
}

[data-theme="dark"] {
  --color-background: oklch(0.13 0.015 270);
  --color-foreground: oklch(0.97 0.01 270);
  --color-card: oklch(0.16 0.015 270);
  --color-card-foreground: oklch(0.97 0.01 270);
  --color-primary: oklch(0.67 0.2 285);
  --color-primary-foreground: oklch(0.13 0.015 270);
  --color-secondary: oklch(0.22 0.015 270);
  --color-secondary-foreground: oklch(0.97 0.01 270);
  --color-muted: oklch(0.22 0.015 270);
  --color-muted-foreground: oklch(0.65 0.02 270);
  --color-accent: oklch(0.22 0.015 270);
  --color-accent-foreground: oklch(0.97 0.01 270);
  --color-destructive: oklch(0.62 0.22 25);
  --color-destructive-foreground: oklch(0.99 0 0);
  --color-border: oklch(0.25 0.015 270);
  --color-input: oklch(0.25 0.015 270);
  --color-ring: oklch(0.67 0.2 285);
}

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
  font-feature-settings: "cv11", "ss01";
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Importar globals.css**

`src/renderer/src/main.tsx`:

```tsx
import './styles/globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Apagar tudo que o template colocou em `src/renderer/src/App.tsx` e substituir por:

```tsx
export default function App() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-2xl font-semibold">DevSenses</h1>
    </div>
  )
}
```

Apagar `src/renderer/src/assets/` (logos do template) e qualquer CSS antigo.

- [ ] **Step 5: Atualizar tsconfig.web.json**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": [
    "src/renderer/src/env.d.ts",
    "src/renderer/src/**/*",
    "src/renderer/src/**/*.tsx",
    "src/preload/*.d.ts",
    "src/shared/**/*"
  ],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

Mesma seção `paths` em `tsconfig.node.json` adicionando `@shared/*`.

- [ ] **Step 6: Verificar dev**

```bash
npm run dev
```

Esperado: janela mostra "DevSenses" centralizado, fonte sistema, fundo branco. Sem erro de Tailwind no console DevTools.

- [ ] **Step 7: Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```

Responder:
- "Which style?" → `New York`
- "Which color?" → `Neutral`
- "CSS variables?" → `Yes`
- "Where is your global CSS?" → `src/renderer/src/styles/globals.css`
- "Where is your tsconfig.json?" → `tsconfig.web.json`
- Caminho components → `src/renderer/src/components`
- Caminho utils → `src/renderer/src/lib/utils`

Após gerar, conferir `components.json` na raiz. Editar se algo bateu errado.

- [ ] **Step 8: Adicionar componentes shadcn iniciais**

```bash
npx shadcn@latest add button input card select progress badge radio-group label separator alert
```

Verificar que arquivos foram criados em `src/renderer/src/components/ui/`.

- [ ] **Step 9: Instalar Lucide + Framer Motion**

```bash
npm install lucide-react framer-motion
```

- [ ] **Step 10: Smoke test renderizando Button + Card**

Editar `App.tsx`:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            DevSenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Smoke test — Tailwind + shadcn + Lucide funcionando.
          </p>
          <Button>Botão</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 11: Rodar e validar**

```bash
npm run dev
```

Esperado: card centralizado com título + ícone Sparkles + 3 botões com 3 variantes diferentes. Sem warning.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: integrar tailwind v4 + shadcn/ui + lucide"
```

**Critério aceite:** card renderiza, 3 variantes de botão visualmente distintas, ícone Lucide visível.

---

### Task 3: Sistema de Tema (dark/light/auto)

**Files:**
- Create: `src/renderer/src/components/ThemeProvider.tsx`
- Create: `src/renderer/src/hooks/useTheme.ts`
- Create: `src/renderer/src/components/ThemeToggle.tsx`
- Create: `src/shared/settings.ts` (parcial — só `theme`)
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Criar `src/shared/settings.ts`**

```ts
export type ThemeMode = 'dark' | 'light' | 'auto'

export interface SettingsValueMap {
  onboarding_completed: boolean
  user_name: string
  seniority: 'intern' | 'junior' | 'mid' | 'senior'
  seniority_source: 'manual' | 'quiz'
  provider_default: 'claude' | 'codex' | 'gemini' | 'aider' | 'ollama'
  provider_tested: Record<string, boolean>
  theme: ThemeMode
  last_workspace: string | null
  professor_turbo: boolean
}

export type SettingsKey = keyof SettingsValueMap

export const SETTINGS_DEFAULTS: SettingsValueMap = {
  onboarding_completed: false,
  user_name: '',
  seniority: 'junior',
  seniority_source: 'manual',
  provider_default: 'claude',
  provider_tested: {},
  theme: 'auto',
  last_workspace: null,
  professor_turbo: false
}
```

- [ ] **Step 2: ThemeProvider sem persistência ainda (memória)**

`src/renderer/src/components/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeMode } from '@shared/settings'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolve(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'auto') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface Props {
  children: ReactNode
  initialTheme?: ThemeMode
}

export function ThemeProvider({ children, initialTheme = 'auto' }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => resolve(initialTheme))

  useEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)
    document.documentElement.dataset.theme = next
  }, [theme])

  useEffect(() => {
    if (theme !== 'auto') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const next = mql.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      document.documentElement.dataset.theme = next
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve estar dentro de <ThemeProvider>')
  return ctx
}
```

- [ ] **Step 3: ThemeToggle**

`src/renderer/src/components/ThemeToggle.tsx`:

```tsx
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Sistema', icon: Monitor }
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTheme(value)}
          className="gap-2"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Wrap App com ThemeProvider**

`src/renderer/src/App.tsx`:

```tsx
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              DevSenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tema funciona — escolhe abaixo.
            </p>
          </CardContent>
        </Card>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}
```

- [ ] **Step 5: Validar dev**

```bash
npm run dev
```

- Janela abre seguindo tema do SO (auto default)
- Clicar "Claro" → fundo branco, texto escuro
- Clicar "Escuro" → fundo escuro, texto claro
- Clicar "Sistema" → respeita preferência SO
- Trocar tema do SO com app aberto em "Sistema" → app reage

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: sistema de tema dark/light/auto"
```

**Critério aceite:** 3 botões trocam tema, "auto" reage à mudança do SO.

---

### Task 4: SQLite + sistema de migrations

**Files:**
- Create: `src/main/utils/paths.ts`
- Create: `src/main/db/connection.ts`
- Create: `src/main/db/migrations.ts`
- Create: `src/main/db/migrations/001_initial.sql`
- Create: `src/main/db/migrations/002_seen_concepts.sql`
- Create: `tests/main/db/migrations.test.ts`
- Create: `vitest.config.ts`
- Modify: `src/main/index.ts` (chamar migrations on app ready)

- [ ] **Step 1: Instalar dependências**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3 vitest electron-rebuild
```

Adicionar em `package.json` scripts:

```json
{
  "scripts": {
    "postinstall": "electron-builder install-app-deps",
    "rebuild": "electron-rebuild -f -w better-sqlite3",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Rodar:

```bash
npm run rebuild
```

Esperado: rebuilda `better-sqlite3` contra a versão Node do Electron.

- [ ] **Step 2: vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@main': resolve(__dirname, 'src/main')
    }
  }
})
```

- [ ] **Step 3: paths helper**

`src/main/utils/paths.ts`:

```ts
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

export function dataDir(): string {
  // Em testes app pode não estar pronto — fallback HOME
  const base = app?.isReady?.()
    ? app.getPath('userData')
    : join(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.devsenses-test')
  mkdirSync(base, { recursive: true })
  return base
}

export function dbPath(): string {
  return join(dataDir(), 'devsenses.db')
}
```

- [ ] **Step 4: connection singleton**

`src/main/db/connection.ts`:

```ts
import Database from 'better-sqlite3'
import { dbPath } from '../utils/paths'

let instance: Database.Database | null = null

export function getDb(): Database.Database {
  if (instance) return instance
  instance = new Database(dbPath())
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  return instance
}

export function closeDb(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}
```

- [ ] **Step 5: migrations runner**

`src/main/db/migrations.ts`:

```ts
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  sql: string
}

export function loadMigrations(dir: string): Migration[] {
  return readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .map((file) => {
      const match = file.match(/^(\d+)_(.+)\.sql$/)!
      return {
        version: parseInt(match[1], 10),
        name: match[2],
        sql: readFileSync(join(dir, file), 'utf-8')
      }
    })
    .sort((a, b) => a.version - b.version)
}

export function runMigrations(db: Database.Database, dir: string): number[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_version').all().map((r: { version: number }) => r.version)
  )

  const all = loadMigrations(dir)
  const ranNow: number[] = []

  for (const m of all) {
    if (applied.has(m.version)) continue
    const tx = db.transaction(() => {
      db.exec(m.sql)
      db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(m.version, Date.now())
    })
    tx()
    ranNow.push(m.version)
  }

  return ranNow
}

export function migrationsDir(): string {
  // Em produção fica embutido em out/main/db/migrations
  // Em dev/test resolve relativo ao __dirname
  return join(__dirname, 'migrations')
}
```

- [ ] **Step 6: SQL migrations**

`src/main/db/migrations/001_initial.sql`:

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recent_workspaces (
  path TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  last_opened_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS recent_workspaces_last_opened_idx
  ON recent_workspaces (last_opened_at DESC);
```

`src/main/db/migrations/002_seen_concepts.sql`:

```sql
CREATE TABLE IF NOT EXISTS concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT,
  framework TEXT,
  UNIQUE(name, language, framework)
);

CREATE TABLE IF NOT EXISTS user_seen_concepts (
  concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  first_seen_at INTEGER NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  marked_learned INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (concept_id)
);
```

- [ ] **Step 7: Garantir bundling do diretório `migrations` no build**

Adicionar em `electron.vite.config.ts` no bloco `main`:

```ts
import { externalizeDepsPlugin } from 'electron-vite'

main: {
  plugins: [externalizeDepsPlugin()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/main/index.ts')
      }
    }
  },
  // Copia .sql pro out/main/db/migrations
  assetsInclude: ['**/*.sql']
}
```

Plus instalar `vite-plugin-static-copy` pra copiar SQL files:

```bash
npm install -D vite-plugin-static-copy
```

Adicionar plugin no main:

```ts
import { viteStaticCopy } from 'vite-plugin-static-copy'

main: {
  plugins: [
    externalizeDepsPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/main/db/migrations/*.sql',
          dest: 'db/migrations'
        }
      ]
    })
  ],
  // ...resto
}
```

- [ ] **Step 8: Escrever teste FALHANDO da migrations runner**

`tests/main/db/migrations.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations, loadMigrations } from '../../../src/main/db/migrations'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('migrations runner', () => {
  let tmp: string
  let migDir: string
  let db: Database.Database

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'devsenses-test-'))
    migDir = join(tmp, 'migrations')
    mkdirSync(migDir, { recursive: true })
    db = new Database(':memory:')
  })

  afterEach(() => {
    db.close()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('aplica migrations em ordem', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    writeFileSync(join(migDir, '002_b.sql'), 'CREATE TABLE b (id INTEGER);')

    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([1, 2])

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: { name: string }) => r.name)
    expect(tables).toContain('a')
    expect(tables).toContain('b')
  })

  it('é idempotente — segunda chamada não roda nada', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    runMigrations(db, migDir)
    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([])
  })

  it('roda só pendentes quando algumas já estão aplicadas', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    runMigrations(db, migDir)
    writeFileSync(join(migDir, '002_b.sql'), 'CREATE TABLE b (id INTEGER);')
    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([2])
  })

  it('rollback em falha — migration parcial não fica gravada', () => {
    writeFileSync(join(migDir, '001_bad.sql'), 'CREATE TABLE x (id INTEGER); INVALID SQL HERE;')
    expect(() => runMigrations(db, migDir)).toThrow()
    const versions = db.prepare('SELECT version FROM schema_version').all()
    expect(versions).toEqual([])
  })

  it('loadMigrations ignora arquivos inválidos', () => {
    writeFileSync(join(migDir, 'README.md'), '# whatever')
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    const list = loadMigrations(migDir)
    expect(list.length).toBe(1)
  })
})
```

Rodar:

```bash
npm test
```

Esperado: 5 testes passam.

- [ ] **Step 9: Wire ao main**

`src/main/index.ts` — adicionar no `app.whenReady()`:

```ts
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { getDb, closeDb } from './db/connection'
import { runMigrations, migrationsDir } from './db/migrations'

// ...resto do template já existente...

app.whenReady().then(() => {
  const db = getDb()
  const ran = runMigrations(db, migrationsDir())
  if (ran.length > 0) {
    console.log(`[migrations] applied: ${ran.join(', ')}`)
  }

  // ...createWindow() etc...
})

app.on('before-quit', () => {
  closeDb()
})
```

- [ ] **Step 10: Validar dev**

```bash
npm run dev
```

Esperado: terminal mostra `[migrations] applied: 1, 2` na primeira execução. Próximas execuções: nada (já aplicadas). Janela abre normal.

Conferir DB:

```bash
ls ~/Library/Application\ Support/devsenses/devsenses.db   # macOS
# Windows: %APPDATA%/devsenses/devsenses.db
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: sqlite + sistema de migrations + testes"
```

**Critério aceite:** Testes passam (5/5). App roda + cria DB. Logs mostram migrations aplicadas só na primeira vez.

---

### Task 5: SettingsRepository + IPC handlers

**Files:**
- Create: `src/main/repositories/settings.ts`
- Create: `tests/main/repositories/settings.test.ts`
- Create: `src/shared/ipc-contract.ts`
- Create: `src/main/ipc/index.ts`
- Create: `src/main/ipc/settings.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Criar `src/shared/ipc-contract.ts`**

Conforme bloco do header "Contrato IPC" deste plano. Copiar exatamente.

Importante: tipos `ProviderId` e helpers virão na Task 7. Por enquanto criar `src/shared/providers.ts` mínimo:

```ts
// src/shared/providers.ts (provisório — completar na Task 7)
export const PROVIDER_IDS = ['claude', 'codex', 'gemini', 'aider', 'ollama'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ProviderStatus {
  installed: boolean
  binaryPath: string | null
  version: string | null
}
```

- [ ] **Step 2: Teste FALHANDO `tests/main/repositories/settings.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SettingsRepository } from '../../../src/main/repositories/settings'

describe('SettingsRepository', () => {
  let db: Database.Database
  let repo: SettingsRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    repo = new SettingsRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('get retorna null quando key não existe', () => {
    expect(repo.get('user_name')).toBeNull()
  })

  it('set + get roundtrip string', () => {
    repo.set('user_name', 'Luccas')
    expect(repo.get('user_name')).toBe('Luccas')
  })

  it('set + get roundtrip boolean', () => {
    repo.set('onboarding_completed', true)
    expect(repo.get('onboarding_completed')).toBe(true)
  })

  it('set + get roundtrip object', () => {
    repo.set('provider_tested', { claude: true, codex: false })
    expect(repo.get('provider_tested')).toEqual({ claude: true, codex: false })
  })

  it('set faz upsert (atualiza)', () => {
    repo.set('user_name', 'A')
    repo.set('user_name', 'B')
    expect(repo.get('user_name')).toBe('B')
  })

  it('all retorna todas chaves setadas', () => {
    repo.set('user_name', 'Luccas')
    repo.set('seniority', 'mid')
    expect(repo.all()).toEqual({ user_name: 'Luccas', seniority: 'mid' })
  })
})
```

Rodar:

```bash
npm test
```

Esperado: testes falham com "Cannot find module".

- [ ] **Step 3: Implementar SettingsRepository**

`src/main/repositories/settings.ts`:

```ts
import type Database from 'better-sqlite3'
import type { SettingsKey, SettingsValueMap } from '@shared/settings'

export class SettingsRepository {
  private getStmt: Database.Statement
  private setStmt: Database.Statement
  private allStmt: Database.Statement

  constructor(private db: Database.Database) {
    this.getStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    this.setStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    this.allStmt = db.prepare('SELECT key, value FROM settings')
  }

  get<K extends SettingsKey>(key: K): SettingsValueMap[K] | null {
    const row = this.getStmt.get(key) as { value: string } | undefined
    if (!row) return null
    return JSON.parse(row.value) as SettingsValueMap[K]
  }

  set<K extends SettingsKey>(key: K, value: SettingsValueMap[K]): void {
    this.setStmt.run(key, JSON.stringify(value), Date.now())
  }

  all(): Partial<SettingsValueMap> {
    const rows = this.allStmt.all() as { key: string; value: string }[]
    const out: Record<string, unknown> = {}
    for (const r of rows) out[r.key] = JSON.parse(r.value)
    return out as Partial<SettingsValueMap>
  }
}
```

Rodar:

```bash
npm test
```

Esperado: 6 testes passam.

- [ ] **Step 4: IPC handler settings**

`src/main/ipc/settings.ts`:

```ts
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import type { IpcContract } from '@shared/ipc-contract'

let repo: SettingsRepository | null = null
function getRepo(): SettingsRepository {
  if (!repo) repo = new SettingsRepository(getDb())
  return repo
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_, payload: IpcContract['settings:get']['request']) => {
    return getRepo().get(payload.key)
  })

  ipcMain.handle('settings:set', (_, payload: IpcContract['settings:set']['request']) => {
    getRepo().set(payload.key, payload.value)
  })

  ipcMain.handle('settings:all', () => {
    return getRepo().all()
  })
}
```

- [ ] **Step 5: Registrador central IPC**

`src/main/ipc/index.ts`:

```ts
import { registerSettingsHandlers } from './settings'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  // providers + workspace registrados em tasks futuras
}
```

- [ ] **Step 6: Wire main**

`src/main/index.ts`, dentro do `app.whenReady()`:

```ts
import { registerIpcHandlers } from './ipc'

// dentro do .whenReady() depois das migrations:
registerIpcHandlers()
```

- [ ] **Step 7: Atualizar preload com API tipada**

`src/preload/index.ts`:

```ts
import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcContract, IpcEvents } from '@shared/ipc-contract'

const api = {
  invoke<C extends IpcChannel>(channel: C, payload: IpcContract[C]['request']): Promise<IpcContract[C]['response']> {
    return ipcRenderer.invoke(channel, payload)
  },
  on<E extends keyof IpcEvents>(event: E, listener: (data: IpcEvents[E]) => void): () => void {
    const wrapped = (_: unknown, data: IpcEvents[E]) => listener(data)
    ipcRenderer.on(event, wrapped)
    return () => ipcRenderer.removeListener(event, wrapped)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error contextIsolation desabilitado é fallback
  window.api = api
}
```

- [ ] **Step 8: Tipagem global do `window.api` no renderer**

Criar `src/renderer/src/env.d.ts`:

```ts
/// <reference types="vite/client" />
import type { IpcChannel, IpcContract, IpcEvents } from '@shared/ipc-contract'

declare global {
  interface Window {
    api: {
      invoke<C extends IpcChannel>(channel: C, payload: IpcContract[C]['request']): Promise<IpcContract[C]['response']>
      on<E extends keyof IpcEvents>(event: E, listener: (data: IpcEvents[E]) => void): () => void
    }
  }
}

export {}
```

- [ ] **Step 9: Hook useSettings no renderer**

`src/renderer/src/hooks/useSettings.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { SettingsKey, SettingsValueMap } from '@shared/settings'
import { SETTINGS_DEFAULTS } from '@shared/settings'

export function useSettings<K extends SettingsKey>(
  key: K
): {
  value: SettingsValueMap[K]
  setValue: (next: SettingsValueMap[K]) => Promise<void>
  loading: boolean
} {
  const [value, setLocal] = useState<SettingsValueMap[K]>(SETTINGS_DEFAULTS[key])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.api.invoke('settings:get', { key }).then((v) => {
      if (cancelled) return
      if (v !== null) setLocal(v as SettingsValueMap[K])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  const setValue = useCallback(
    async (next: SettingsValueMap[K]) => {
      await window.api.invoke('settings:set', { key, value: next })
      setLocal(next)
    },
    [key]
  )

  return { value, setValue, loading }
}
```

- [ ] **Step 10: Smoke test no App.tsx**

Substituir `App.tsx` provisoriamente:

```tsx
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSettings } from './hooks/useSettings'

function NameField() {
  const { value, setValue, loading } = useSettings('user_name')
  if (loading) return <p className="text-sm">Carregando...</p>
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Seu nome"
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Smoke test settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <NameField />
            <p className="text-xs text-muted-foreground">
              Digita, fecha o app, abre de novo — deve persistir.
            </p>
          </CardContent>
        </Card>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}
```

- [ ] **Step 11: Validar persistência**

```bash
npm run dev
```

- Digitar nome → fechar janela → reabrir (`npm run dev`) → nome aparece de volta.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: settings repository + ipc + hook useSettings"
```

**Critério aceite:** Testes passam (6/6). Nome digitado persiste entre reaberturas.

---

### Task 6: Provider abstraction + detecção (sem invocação ainda)

**Files:**
- Create: `src/main/providers/types.ts`
- Create: `src/main/providers/detect.ts`
- Create: `src/main/providers/registry.ts`
- Create: `src/main/providers/claude.ts`
- Create: `src/main/providers/codex.ts`
- Create: `src/main/providers/gemini.ts`
- Create: `src/main/providers/aider.ts`
- Create: `src/main/providers/ollama.ts`
- Create: `tests/main/providers/detect.test.ts`
- Modify: `src/shared/providers.ts`

- [ ] **Step 1: Atualizar `src/shared/providers.ts`**

```ts
export const PROVIDER_IDS = ['claude', 'codex', 'gemini', 'aider', 'ollama'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ProviderStatus {
  installed: boolean
  binaryPath: string | null
  version: string | null
}

export interface ProviderMeta {
  id: ProviderId
  label: string
  description: string
  binaryName: string
  homepage: string
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    description: 'CLI oficial Anthropic',
    binaryName: 'claude',
    homepage: 'https://docs.claude.com/en/docs/claude-code'
  },
  codex: {
    id: 'codex',
    label: 'OpenAI Codex',
    description: 'CLI oficial OpenAI',
    binaryName: 'codex',
    homepage: 'https://github.com/openai/codex'
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini CLI',
    description: 'CLI oficial Google',
    binaryName: 'gemini',
    homepage: 'https://github.com/google-gemini/gemini-cli'
  },
  aider: {
    id: 'aider',
    label: 'Aider',
    description: 'CLI multi-provider open-source',
    binaryName: 'aider',
    homepage: 'https://aider.chat'
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    description: 'LLMs locais (sem API key)',
    binaryName: 'ollama',
    homepage: 'https://ollama.com'
  }
}
```

- [ ] **Step 2: Tipos main**

`src/main/providers/types.ts`:

```ts
import type { ProviderId } from '@shared/providers'

export interface InvokeOptions {
  prompt: string
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: Error) => void
  abortSignal?: AbortSignal
}

export interface AIProvider {
  id: ProviderId
  binary(): string
  buildArgs(opts: { prompt: string; testMode?: boolean }): string[]
  /** Versão extraída via --version. Lança em falha. */
  detectVersion(binaryPath: string): Promise<string | null>
  /** Invoca o CLI streamando saída. testMode envia prompt curto pra validar. */
  invoke(opts: InvokeOptions): Promise<void>
}
```

- [ ] **Step 3: Detecção cross-platform**

`src/main/providers/detect.ts`:

```ts
import { spawnSync } from 'child_process'

const isWin = process.platform === 'win32'
const lookupCmd = isWin ? 'where' : 'which'

export function findBinary(name: string): string | null {
  const result = spawnSync(lookupCmd, [name], { encoding: 'utf-8' })
  if (result.status !== 0) return null
  const out = (result.stdout || '').trim().split(/\r?\n/)[0]
  return out || null
}

export async function detectVersion(binary: string, args: string[] = ['--version']): Promise<string | null> {
  const result = spawnSync(binary, args, { encoding: 'utf-8', timeout: 5_000 })
  if (result.status !== 0) return null
  const text = (result.stdout || result.stderr || '').trim()
  // pega primeira sequência tipo X.Y.Z ou número-major
  const match = text.match(/(\d+\.\d+\.\d+|\d+\.\d+|\d+)/)
  return match ? match[1] : text.slice(0, 40) || null
}
```

- [ ] **Step 4: Provider Claude**

`src/main/providers/claude.ts`:

```ts
import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const claudeProvider: AIProvider = {
  id: 'claude',
  binary() {
    return 'claude'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) {
      return ['-p', 'Reply with exactly the word: ok', '--output-format', 'text']
    }
    return ['-p', prompt, '--output-format', 'text']
  },
  detectVersion(bin) {
    return detectVersion(bin)
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[claude stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`claude saiu com código ${code}`))
    })
  }
}
```

- [ ] **Step 5: Provider Codex**

`src/main/providers/codex.ts`:

```ts
import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const codexProvider: AIProvider = {
  id: 'codex',
  binary() {
    return 'codex'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) return ['exec', 'Reply with exactly: ok']
    return ['exec', prompt]
  },
  detectVersion(bin) {
    return detectVersion(bin, ['--version'])
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[codex stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`codex saiu com código ${code}`))
    })
  }
}
```

- [ ] **Step 6: Provider Gemini**

`src/main/providers/gemini.ts`:

```ts
import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const geminiProvider: AIProvider = {
  id: 'gemini',
  binary() {
    return 'gemini'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) return ['-p', 'Reply with exactly: ok']
    return ['-p', prompt]
  },
  detectVersion(bin) {
    return detectVersion(bin, ['--version'])
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[gemini stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`gemini saiu com código ${code}`))
    })
  }
}
```

- [ ] **Step 7: Provider Aider**

`src/main/providers/aider.ts`:

```ts
import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const aiderProvider: AIProvider = {
  id: 'aider',
  binary() {
    return 'aider'
  },
  buildArgs({ prompt, testMode }) {
    const base = ['--no-pretty', '--yes-always', '--no-auto-commits', '--no-stream']
    if (testMode) return [...base, '--message', 'Reply with exactly: ok']
    return [...base, '--message', prompt]
  },
  detectVersion(bin) {
    return detectVersion(bin, ['--version'])
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[aider stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`aider saiu com código ${code}`))
    })
  }
}
```

- [ ] **Step 8: Provider Ollama**

`src/main/providers/ollama.ts`:

```ts
import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

const DEFAULT_MODEL = 'llama3.2'

export const ollamaProvider: AIProvider = {
  id: 'ollama',
  binary() {
    return 'ollama'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) return ['run', DEFAULT_MODEL, 'Reply with exactly: ok']
    return ['run', DEFAULT_MODEL, prompt]
  },
  detectVersion(bin) {
    return detectVersion(bin, ['--version'])
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[ollama stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`ollama saiu com código ${code}`))
    })
  }
}
```

- [ ] **Step 9: Registry**

`src/main/providers/registry.ts`:

```ts
import type { ProviderId } from '@shared/providers'
import type { AIProvider } from './types'
import { claudeProvider } from './claude'
import { codexProvider } from './codex'
import { geminiProvider } from './gemini'
import { aiderProvider } from './aider'
import { ollamaProvider } from './ollama'

export const PROVIDERS: Record<ProviderId, AIProvider> = {
  claude: claudeProvider,
  codex: codexProvider,
  gemini: geminiProvider,
  aider: aiderProvider,
  ollama: ollamaProvider
}
```

- [ ] **Step 10: Teste de detecção**

`tests/main/providers/detect.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { findBinary } from '../../../src/main/providers/detect'

describe('findBinary', () => {
  it('encontra binário existente', () => {
    // node sempre existe no env de teste
    const path = findBinary('node')
    expect(path).toBeTruthy()
    expect(path).toMatch(/node/)
  })

  it('retorna null pra binário inexistente', () => {
    const path = findBinary('this-binary-does-not-exist-xyz-12345')
    expect(path).toBeNull()
  })
})
```

Rodar:

```bash
npm test
```

Esperado: 2 testes passam.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: provider abstraction + detecção 5 clis"
```

**Critério aceite:** Testes passam. Sem chamada IPC ainda — invocação vem na Task 8.

---

### Task 7: IPC handlers de providers (detect + test + invoke streaming)

**Files:**
- Create: `src/main/ipc/providers.ts`
- Modify: `src/main/ipc/index.ts`

- [ ] **Step 1: Handler detect**

`src/main/ipc/providers.ts`:

```ts
import { ipcMain, BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import type { IpcContract } from '@shared/ipc-contract'
import { PROVIDER_IDS, PROVIDER_META, type ProviderId, type ProviderStatus } from '@shared/providers'
import { findBinary } from '../providers/detect'
import { PROVIDERS } from '../providers/registry'

async function detectAll(): Promise<Record<ProviderId, ProviderStatus>> {
  const out: Record<string, ProviderStatus> = {}
  for (const id of PROVIDER_IDS) {
    const meta = PROVIDER_META[id]
    const path = findBinary(meta.binaryName)
    let version: string | null = null
    if (path) {
      try {
        version = await PROVIDERS[id].detectVersion(path)
      } catch {
        version = null
      }
    }
    out[id] = { installed: !!path, binaryPath: path, version }
  }
  return out as Record<ProviderId, ProviderStatus>
}

const TEST_TIMEOUT_MS = 15_000

async function testProvider(id: ProviderId): Promise<{ ok: boolean; latencyMs: number; error: string | null }> {
  const provider = PROVIDERS[id]
  const meta = PROVIDER_META[id]
  const bin = findBinary(meta.binaryName)
  if (!bin) {
    return { ok: false, latencyMs: 0, error: `binário "${meta.binaryName}" não encontrado` }
  }

  return new Promise((resolve) => {
    const start = Date.now()
    let output = ''
    const ac = new AbortController()
    const timer = setTimeout(() => {
      ac.abort()
      resolve({ ok: false, latencyMs: Date.now() - start, error: 'timeout 15s' })
    }, TEST_TIMEOUT_MS)

    provider.invoke({
      prompt: 'Reply with exactly: ok',
      onChunk: (c) => {
        output += c
      },
      onDone: () => {
        clearTimeout(timer)
        const latencyMs = Date.now() - start
        const lower = output.toLowerCase()
        const ok = lower.includes('ok')
        resolve({ ok, latencyMs, error: ok ? null : `resposta inesperada: ${output.slice(0, 100)}` })
      },
      onError: (err) => {
        clearTimeout(timer)
        resolve({ ok: false, latencyMs: Date.now() - start, error: err.message })
      },
      abortSignal: ac.signal
    })
  })
}

const activeStreams = new Map<string, AbortController>()

export function registerProviderHandlers(): void {
  ipcMain.handle('providers:detect', async () => {
    return detectAll()
  })

  ipcMain.handle('providers:test', async (_, payload: IpcContract['providers:test']['request']) => {
    return testProvider(payload.id)
  })

  ipcMain.handle('providers:invoke', async (event, payload: IpcContract['providers:invoke']['request']) => {
    const { id, prompt, streamId } = payload
    const provider = PROVIDERS[id]
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const ac = new AbortController()
    activeStreams.set(streamId, ac)

    const send = (chunk: string, done: boolean, error: string | null) => {
      win.webContents.send('providers:stream', { streamId, chunk, done, error })
    }

    provider.invoke({
      prompt,
      onChunk: (c) => send(c, false, null),
      onDone: () => {
        activeStreams.delete(streamId)
        send('', true, null)
      },
      onError: (err) => {
        activeStreams.delete(streamId)
        send('', true, err.message)
      },
      abortSignal: ac.signal
    })
  })

  ipcMain.handle('providers:abort', (_, payload: { streamId: string }) => {
    const ac = activeStreams.get(payload.streamId)
    if (ac) {
      ac.abort()
      activeStreams.delete(payload.streamId)
    }
  })
}
```

Adicionar `'providers:abort'` ao `IpcContract`:

```ts
'providers:abort': {
  request: { streamId: string }
  response: void
}
```

- [ ] **Step 2: Wire**

Atualizar `src/main/ipc/index.ts`:

```ts
import { registerSettingsHandlers } from './settings'
import { registerProviderHandlers } from './providers'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  registerProviderHandlers()
}
```

- [ ] **Step 3: Helper `randomUUID` de stream id no renderer**

`src/renderer/src/lib/api.ts`:

```ts
import type { ProviderId } from '@shared/providers'

export async function streamProvider(opts: {
  id: ProviderId
  prompt: string
  onChunk: (chunk: string) => void
  onDone: (error: string | null) => void
}): Promise<{ abort: () => void }> {
  const streamId = crypto.randomUUID()

  const off = window.api.on('providers:stream', (data) => {
    if (data.streamId !== streamId) return
    if (data.done) {
      off()
      opts.onDone(data.error)
    } else {
      opts.onChunk(data.chunk)
    }
  })

  await window.api.invoke('providers:invoke', { id: opts.id, prompt: opts.prompt, streamId })

  return {
    abort: () => {
      window.api.invoke('providers:abort', { streamId })
      off()
    }
  }
}
```

- [ ] **Step 4: Smoke test no App**

Substituir `App.tsx` provisoriamente pra um botão "detectar":

```tsx
import { useState } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProviderId, ProviderStatus } from '@shared/providers'
import { PROVIDER_IDS, PROVIDER_META } from '@shared/providers'

function ProviderProbe() {
  const [status, setStatus] = useState<Record<ProviderId, ProviderStatus> | null>(null)

  async function run() {
    const r = await window.api.invoke('providers:detect', undefined)
    setStatus(r)
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Detectar CLIs</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={run}>Detectar</Button>
        {status && (
          <ul className="text-sm space-y-1 font-mono">
            {PROVIDER_IDS.map((id) => (
              <li key={id} className="flex justify-between">
                <span>{PROVIDER_META[id].label}</span>
                <span className={status[id].installed ? 'text-green-600' : 'text-muted-foreground'}>
                  {status[id].installed ? `✓ ${status[id].version ?? '?'}` : '✗'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex h-full items-center justify-center p-8">
        <ProviderProbe />
      </div>
    </ThemeProvider>
  )
}
```

- [ ] **Step 5: Validar**

```bash
npm run dev
```

Clicar "Detectar". Lista mostra ✓ verde nas CLIs instaladas (claude/codex/gemini), ✗ nas que faltam.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: ipc detect + test + invoke streaming providers"
```

**Critério aceite:** Botão "Detectar" no smoke test mostra status correto pelo menos pra `claude`, `codex`, `gemini` (que o usuário tem instalados).

---

### Task 8: Workspace handler + IPC pickFolder

**Files:**
- Create: `src/main/ipc/workspace.ts`
- Modify: `src/main/ipc/index.ts`

- [ ] **Step 1: Handler**

`src/main/ipc/workspace.ts`:

```ts
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { basename } from 'path'
import { getDb } from '../db/connection'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:pickFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const path = result.filePaths[0]
    const name = basename(path)

    const db = getDb()
    db.prepare(`
      INSERT INTO recent_workspaces (path, name, last_opened_at)
      VALUES (?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET name = excluded.name, last_opened_at = excluded.last_opened_at
    `).run(path, name, Date.now())

    return { path, name }
  })

  ipcMain.handle('workspace:recent', () => {
    const db = getDb()
    const rows = db.prepare(`
      SELECT path, name, last_opened_at as lastOpenedAt
      FROM recent_workspaces
      ORDER BY last_opened_at DESC
      LIMIT 10
    `).all() as { path: string; name: string; lastOpenedAt: number }[]
    return rows
  })
}
```

- [ ] **Step 2: Wire**

`src/main/ipc/index.ts`:

```ts
import { registerSettingsHandlers } from './settings'
import { registerProviderHandlers } from './providers'
import { registerWorkspaceHandlers } from './workspace'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  registerProviderHandlers()
  registerWorkspaceHandlers()
}
```

- [ ] **Step 3: Smoke test rápido**

Adicionar botão temporário no App.tsx:

```tsx
<Button onClick={async () => {
  const r = await window.api.invoke('workspace:pickFolder', undefined)
  alert(JSON.stringify(r))
}}>Escolher pasta</Button>
```

```bash
npm run dev
```

Clicar → diálogo nativo abre → escolher pasta → alert mostra `{path, name}`.

Remover o botão temporário antes do commit.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: workspace picker + recents"
```

**Critério aceite:** Diálogo nativo funciona em macOS (e em Windows ao buildar lá depois).

---

### Task 9: Routing + first-launch detection

**Files:**
- Create: `src/renderer/src/routes.tsx`
- Create: `src/renderer/src/pages/Home/index.tsx`
- Modify: `src/renderer/src/App.tsx`
- Install: `react-router-dom`

- [ ] **Step 1: Instalar**

```bash
npm install react-router-dom@^7
```

- [ ] **Step 2: Placeholder Home**

`src/renderer/src/pages/Home/index.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSettings } from '@/hooks/useSettings'

export default function Home() {
  const { value: name } = useSettings('user_name')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            DevSenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            E aí, <strong>{name || 'dev'}</strong>! Aqui vai entrar o Diff Reviewer (Fase 2).
          </p>
        </CardContent>
      </Card>
      <ThemeToggle />
    </div>
  )
}
```

- [ ] **Step 3: Onboarding placeholder**

Criar `src/renderer/src/pages/Onboarding/index.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'

export default function Onboarding() {
  const { setValue } = useSettings('onboarding_completed')
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Onboarding (placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Implementação real vem nas Tasks 10–18.
          </p>
          <Button onClick={() => setValue(true)}>Marcar como concluído</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Routes**

`src/renderer/src/routes.tsx`:

```tsx
import { Navigate, createHashRouter } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import { useSettings } from './hooks/useSettings'

function FirstLaunchGate() {
  const { value: completed, loading } = useSettings('onboarding_completed')
  if (loading) return null
  return <Navigate to={completed ? '/home' : '/onboarding'} replace />
}

export const router = createHashRouter([
  { path: '/', element: <FirstLaunchGate /> },
  { path: '/onboarding/*', element: <Onboarding /> },
  { path: '/home', element: <Home /> }
])
```

`createHashRouter` é necessário em Electron — `BrowserRouter` quebra com `file://`.

- [ ] **Step 5: App**

`src/renderer/src/App.tsx`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { router } from './routes'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
```

- [ ] **Step 6: Validar**

```bash
npm run dev
```

- Primeira vez: redireciona pra `/onboarding`
- Clicar "Marcar como concluído"
- Reabrir app: redireciona pra `/home`
- Apagar manualmente o setting (`sqlite3 ~/Library/Application\ Support/devsenses/devsenses.db "DELETE FROM settings WHERE key='onboarding_completed'"`) e reabrir → volta pra `/onboarding`.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: routing + first-launch gate"
```

**Critério aceite:** Fluxo onboarding → home funciona. Reabrir respeita estado.

---

# FASE 1 — ONBOARDING

Tasks 10–18 implementam os 8 steps + shell. Task 19 prepara settings (refazer onboarding). Tasks 20–21 finalizam build/empacotamento.

---

### Task 10: Onboarding shell (layout + progress + navegação + store)

**Files:**
- Create: `src/renderer/src/stores/onboarding.ts` (zustand)
- Create: `src/renderer/src/components/OnboardingProgress.tsx`
- Create: `src/renderer/src/pages/Onboarding/Shell.tsx`
- Modify: `src/renderer/src/pages/Onboarding/index.tsx` (vira router interno)
- Install: `zustand`

- [ ] **Step 1: Instalar zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Store**

`src/renderer/src/stores/onboarding.ts`:

```ts
import { create } from 'zustand'
import type { SettingsValueMap } from '@shared/settings'
import type { ProviderId } from '@shared/providers'

export type OnboardingStep =
  | 'welcome'
  | 'name'
  | 'seniority'
  | 'providers'
  | 'test'
  | 'theme'
  | 'workspace'
  | 'summary'

export const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'name',
  'seniority',
  'providers',
  'test',
  'theme',
  'workspace',
  'summary'
]

interface OnboardingState {
  step: OnboardingStep
  draft: Partial<SettingsValueMap> & {
    workspacePath?: string | null
    providerInstalled?: ProviderId[]
  }

  goNext: () => void
  goPrev: () => void
  goTo: (step: OnboardingStep) => void
  setDraft: <K extends keyof OnboardingState['draft']>(key: K, value: OnboardingState['draft'][K]) => void
  reset: () => void
}

const INITIAL_DRAFT: OnboardingState['draft'] = {
  user_name: '',
  seniority: 'junior',
  seniority_source: 'manual',
  provider_default: 'claude',
  theme: 'auto',
  last_workspace: null
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  step: 'welcome',
  draft: { ...INITIAL_DRAFT },

  goNext: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx < STEP_ORDER.length - 1) set({ step: STEP_ORDER[idx + 1] })
  },
  goPrev: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] })
  },
  goTo: (step) => set({ step }),
  setDraft: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value } })),
  reset: () => set({ step: 'welcome', draft: { ...INITIAL_DRAFT } })
}))
```

- [ ] **Step 3: ProgressBar**

`src/renderer/src/components/OnboardingProgress.tsx`:

```tsx
import { STEP_ORDER, type OnboardingStep } from '@/stores/onboarding'
import { cn } from '@/lib/utils'

export function OnboardingProgress({ current }: { current: OnboardingStep }) {
  const idx = STEP_ORDER.indexOf(current)
  const total = STEP_ORDER.length
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {idx + 1} / {total}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Shell**

`src/renderer/src/pages/Onboarding/Shell.tsx`:

```tsx
import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingProgress } from '@/components/OnboardingProgress'
import { useOnboarding } from '@/stores/onboarding'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  children: ReactNode
  title: string
  subtitle?: string
  onNext?: () => Promise<void> | void
  nextLabel?: string
  nextDisabled?: boolean
  hidePrev?: boolean
  hideNext?: boolean
}

export function Shell({
  children,
  title,
  subtitle,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled,
  hidePrev,
  hideNext
}: Props) {
  const { step, goNext, goPrev } = useOnboarding()

  async function handleNext() {
    if (onNext) await onNext()
    goNext()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-10 pt-8">
        <OnboardingProgress current={step} />
      </div>

      <div className="flex-1 flex items-center justify-center px-10 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl"
          >
            <h1 className="text-3xl font-semibold tracking-tight mb-1">{title}</h1>
            {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-10 pb-8 flex items-center justify-between">
        {hidePrev ? <span /> : (
          <Button variant="ghost" onClick={goPrev}>
            <ChevronLeft className="size-4 mr-1" />
            Voltar
          </Button>
        )}
        {!hideNext && (
          <Button onClick={handleNext} disabled={nextDisabled}>
            {nextLabel}
            <ChevronRight className="size-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Onboarding index — switch por step**

`src/renderer/src/pages/Onboarding/index.tsx`:

```tsx
import { useOnboarding } from '@/stores/onboarding'
import Welcome from './steps/Welcome'
import Name from './steps/Name'
import Seniority from './steps/Seniority'
import ProviderDetect from './steps/ProviderDetect'
import ProviderTest from './steps/ProviderTest'
import Theme from './steps/Theme'
import Workspace from './steps/Workspace'
import Summary from './steps/Summary'

export default function Onboarding() {
  const step = useOnboarding((s) => s.step)
  switch (step) {
    case 'welcome':
      return <Welcome />
    case 'name':
      return <Name />
    case 'seniority':
      return <Seniority />
    case 'providers':
      return <ProviderDetect />
    case 'test':
      return <ProviderTest />
    case 'theme':
      return <Theme />
    case 'workspace':
      return <Workspace />
    case 'summary':
      return <Summary />
  }
}
```

- [ ] **Step 6: Stub de cada step**

Criar todos os arquivos abaixo apontando pra Shell ainda sem conteúdo real (só pra compilar):

`src/renderer/src/pages/Onboarding/steps/Welcome.tsx`:

```tsx
import { Shell } from '../Shell'
export default function Welcome() {
  return <Shell title="Welcome stub" hidePrev>welcome</Shell>
}
```

Repetir o mesmo padrão pra `Name`, `Seniority`, `ProviderDetect`, `ProviderTest`, `Theme`, `Workspace`, `Summary` — só mudando o título e `hidePrev`/`hideNext` quando faz sentido.

- [ ] **Step 7: Verificar dev**

```bash
npm run dev
```

- Vai pra `/onboarding`
- Vê título "Welcome stub" + barra de progresso 1/8 + botão Continuar
- Clica Continuar → vai pro próximo step
- Voltar funciona

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: onboarding shell + store + progress + stubs"
```

**Critério aceite:** Navegação entre 8 stubs funciona com animações sutis.

---

### Task 11: Step Welcome

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Welcome.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { Shell } from '../Shell'
import { Sparkles, Code2, Lightbulb, Bug } from 'lucide-react'

const FEATURES = [
  {
    icon: Code2,
    title: 'Diff inteligente',
    desc: 'A cada mudança do seu repo, o DevSenses lê o diff e te conta o que mudou.'
  },
  {
    icon: Lightbulb,
    title: 'Modo educação',
    desc: 'Explica os conceitos por trás (hooks, libs, patterns) no seu nível.'
  },
  {
    icon: Bug,
    title: 'Análise crítica',
    desc: 'Aponta bugs prováveis, problemas de segurança, anti-patterns.'
  }
]

export default function Welcome() {
  return (
    <Shell
      title="Bem-vindo ao DevSenses"
      subtitle="A IDE que ensina o que sua IA fez."
      hidePrev
      nextLabel="Vamos começar"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
          >
            <f.icon className="size-5 text-primary" />
            <h3 className="font-medium">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        <span>Vamos configurar em 8 passos rápidos.</span>
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Validar manualmente**

`npm run dev` → step Welcome mostra 3 cards + texto rodapé.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(onboarding): step welcome"
```

**Critério aceite:** Card visual bonito com 3 features explicadas curto.

---

### Task 12: Step Name

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Name.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { useOnboarding } from '@/stores/onboarding'
import { Shell } from '../Shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Name() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const value = draft.user_name ?? ''

  return (
    <Shell
      title="Como devemos te chamar?"
      subtitle="Aparece no app pra deixar a vibe pessoal."
      nextDisabled={value.trim().length < 2}
    >
      <div className="flex flex-col gap-2 mt-4">
        <Label htmlFor="name">Seu nome</Label>
        <Input
          id="name"
          value={value}
          onChange={(e) => setDraft('user_name', e.target.value)}
          placeholder="Ex.: Luccas"
          autoFocus
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">
          Pode ser primeiro nome, apelido — o que preferir.
        </p>
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Validar**

`npm run dev` → step Name → digitar → Continuar habilitado só quando tiver 2+ chars.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(onboarding): step name"
```

**Critério aceite:** Botão "Continuar" desabilita pra nomes < 2 chars.

---

### Task 13: Step Seniority (manual + quiz)

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Seniority.tsx`
- Create: `src/renderer/src/pages/Onboarding/steps/SeniorityQuiz.tsx`
- Create: `src/renderer/src/lib/quiz.ts`
- Create: `src/shared/seniority.ts`

- [ ] **Step 1: Helpers shared**

`src/shared/seniority.ts`:

```ts
export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior'

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  intern: 'Estagiário',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior'
}

export const SENIORITY_DESCRIPTIONS: Record<SeniorityLevel, string> = {
  intern: 'Tô começando agora — explica o básico.',
  junior: 'Já programo, mas ainda aprendo conceitos novos toda semana.',
  mid: 'Sei o stack — só comenta decisões e edge cases.',
  senior: 'Manda só análise crítica — bugs, perf, security.'
}
```

- [ ] **Step 2: Banco de perguntas quiz**

`src/renderer/src/lib/quiz.ts`:

```ts
import type { SeniorityLevel } from '@shared/seniority'

export interface QuizQuestion {
  id: string
  question: string
  options: { label: string; weight: Record<SeniorityLevel, number> }[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'closure',
    question: 'O que é uma closure em JavaScript?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Função dentro de outra função', weight: { intern: 0, junior: 2, mid: 0, senior: 0 } },
      { label: 'Função que captura variáveis do escopo onde foi criada', weight: { intern: 0, junior: 1, mid: 3, senior: 3 } },
      { label: 'Mesma coisa que IIFE', weight: { intern: 0, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'react-render',
    question: 'Quando um componente React re-renderiza?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Sempre que algo na página muda', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      { label: 'Quando state ou props mudam, ou o pai re-renderiza', weight: { intern: 0, junior: 2, mid: 3, senior: 2 } },
      { label: 'Só quando setState é chamado e o React decide via fiber reconciler', weight: { intern: 0, junior: 0, mid: 2, senior: 3 } }
    ]
  },
  {
    id: 'use-effect-deps',
    question: 'Qual o efeito de `[]` como dependências do useEffect?',
    options: [
      { label: 'Não sei o que é useEffect', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Roda toda vez que o componente renderiza', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      { label: 'Roda só na montagem (e cleanup na desmontagem)', weight: { intern: 0, junior: 3, mid: 3, senior: 3 } },
      { label: 'Roda só uma vez no app inteiro', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'async-await',
    question: '`async function` retorna…',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'O valor que dei no `return`', weight: { intern: 1, junior: 0, mid: 0, senior: 0 } },
      { label: 'Uma Promise que resolve com o valor do return', weight: { intern: 0, junior: 2, mid: 3, senior: 3 } },
      { label: 'Um observable', weight: { intern: 0, junior: 0, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'memoization',
    question: '`useMemo` serve pra…',
    options: [
      { label: 'Não conheço', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      { label: 'Memorizar valores entre renders pra evitar recomputar', weight: { intern: 0, junior: 2, mid: 3, senior: 2 } },
      { label: 'Substituir `useState`', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      { label: 'Memoizar quando o cost-benefit faz sentido — geralmente é over-used', weight: { intern: 0, junior: 0, mid: 2, senior: 3 } }
    ]
  },
  {
    id: 'typescript-generics',
    question: 'O que faz `function foo<T>(arg: T): T`?',
    options: [
      { label: 'Não trabalho com TS', weight: { intern: 2, junior: 1, mid: 0, senior: 0 } },
      { label: 'Não entendi a sintaxe', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      { label: 'Recebe e devolve algo do mesmo tipo, preservando o tipo', weight: { intern: 0, junior: 2, mid: 3, senior: 3 } },
      { label: 'Aceita só strings', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'race-condition',
    question: 'Em um componente que faz fetch quando o `id` muda, qual o risco principal?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      { label: 'Lentidão', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      { label: 'Race condition: resposta antiga sobrescrever a nova', weight: { intern: 0, junior: 1, mid: 3, senior: 3 } },
      { label: 'Memory leak', weight: { intern: 0, junior: 1, mid: 1, senior: 1 } }
    ]
  },
  {
    id: 'sql-injection',
    question: 'Qual a melhor proteção contra SQL injection?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Escapar aspas com replace', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      { label: 'Prepared statements / parameterized queries', weight: { intern: 0, junior: 2, mid: 3, senior: 3 } },
      { label: 'Usar HTTPS', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  }
]

export function scoreQuiz(answers: Record<string, number>): SeniorityLevel {
  const totals: Record<SeniorityLevel, number> = { intern: 0, junior: 0, mid: 0, senior: 0 }
  for (const [qId, optionIdx] of Object.entries(answers)) {
    const q = QUIZ_QUESTIONS.find((x) => x.id === qId)
    const opt = q?.options[optionIdx]
    if (!opt) continue
    for (const lvl of Object.keys(totals) as SeniorityLevel[]) {
      totals[lvl] += opt.weight[lvl]
    }
  }
  return (Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0] as SeniorityLevel)
}
```

- [ ] **Step 3: Teste do scoreQuiz**

`tests/shared/seniority.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scoreQuiz, QUIZ_QUESTIONS } from '../../src/renderer/src/lib/quiz'

describe('scoreQuiz', () => {
  it('todas "não sei" → intern', () => {
    const answers: Record<string, number> = {}
    for (const q of QUIZ_QUESTIONS) {
      answers[q.id] = 0   // "não sei" sempre na opção 0
    }
    expect(scoreQuiz(answers)).toBe('intern')
  })

  it('respostas top-tier → senior', () => {
    const answers: Record<string, number> = {
      closure: 2,
      'react-render': 3,
      'use-effect-deps': 2,
      'async-await': 2,
      memoization: 3,
      'typescript-generics': 2,
      'race-condition': 2,
      'sql-injection': 2
    }
    expect(scoreQuiz(answers)).toBe('senior')
  })

  it('respostas mistas básicas → junior', () => {
    const answers: Record<string, number> = {
      closure: 1,
      'react-render': 2,
      'use-effect-deps': 2,
      'async-await': 2,
      memoization: 1,
      'typescript-generics': 2,
      'race-condition': 1,
      'sql-injection': 2
    }
    expect(scoreQuiz(answers)).toBe('junior')
  })
})
```

Rodar:

```bash
npm test
```

Esperado: 3 testes passam.

- [ ] **Step 4: Tela seniority manual**

`src/renderer/src/pages/Onboarding/steps/Seniority.tsx`:

```tsx
import { useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SENIORITY_LABELS, SENIORITY_DESCRIPTIONS, type SeniorityLevel } from '@shared/seniority'
import SeniorityQuiz from './SeniorityQuiz'
import { Sparkles } from 'lucide-react'

const ORDER: SeniorityLevel[] = ['intern', 'junior', 'mid', 'senior']

export default function Seniority() {
  const setDraft = useOnboarding((s) => s.setDraft)
  const draft = useOnboarding((s) => s.draft)
  const [mode, setMode] = useState<'choose' | 'manual' | 'quiz'>('choose')

  if (mode === 'quiz') {
    return (
      <SeniorityQuiz
        onResult={(level) => {
          setDraft('seniority', level)
          setDraft('seniority_source', 'quiz')
          setMode('manual')   // mostra resultado na tela manual com seleção pré-marcada
        }}
        onCancel={() => setMode('choose')}
      />
    )
  }

  if (mode === 'choose') {
    return (
      <Shell
        title="Qual seu nível?"
        subtitle="Isso ajusta a profundidade das explicações da IA."
        hideNext
      >
        <div className="grid gap-3 mt-4">
          <button
            onClick={() => setMode('manual')}
            className="text-left rounded-xl border border-border bg-card hover:bg-accent transition p-5"
          >
            <div className="font-medium mb-1">Selecionar manualmente</div>
            <p className="text-xs text-muted-foreground">Escolho meu nível direto.</p>
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="text-left rounded-xl border border-primary/40 bg-card hover:bg-accent transition p-5 relative"
          >
            <div className="font-medium mb-1 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Fazer um quiz rápido (8 perguntas)
            </div>
            <p className="text-xs text-muted-foreground">
              A IA estima seu nível pelas respostas. Você pode mudar depois.
            </p>
          </button>
        </div>
      </Shell>
    )
  }

  // manual
  return (
    <Shell
      title="Selecione seu nível"
      subtitle={draft.seniority_source === 'quiz' ? 'Sugestão do quiz já marcada — pode ajustar.' : undefined}
      nextDisabled={!draft.seniority}
    >
      <div className="grid gap-2 mt-4">
        {ORDER.map((level) => {
          const selected = draft.seniority === level
          return (
            <button
              key={level}
              onClick={() => {
                setDraft('seniority', level)
                if (draft.seniority_source !== 'quiz') setDraft('seniority_source', 'manual')
              }}
              className={cn(
                'text-left rounded-xl border bg-card p-4 transition',
                selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
              )}
            >
              <div className="font-medium">{SENIORITY_LABELS[level]}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{SENIORITY_DESCRIPTIONS[level]}</p>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => setMode('choose')}
        className="text-xs text-muted-foreground hover:text-foreground mt-4"
      >
        ← refazer escolha do método
      </button>
    </Shell>
  )
}
```

- [ ] **Step 5: Quiz screen**

`src/renderer/src/pages/Onboarding/steps/SeniorityQuiz.tsx`:

```tsx
import { useState } from 'react'
import { Shell } from '../Shell'
import { Button } from '@/components/ui/button'
import { QUIZ_QUESTIONS, scoreQuiz } from '@/lib/quiz'
import type { SeniorityLevel } from '@shared/seniority'
import { cn } from '@/lib/utils'

interface Props {
  onResult: (level: SeniorityLevel) => void
  onCancel: () => void
}

export default function SeniorityQuiz({ onResult, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const q = QUIZ_QUESTIONS[idx]
  const isLast = idx === QUIZ_QUESTIONS.length - 1
  const selected = answers[q.id]

  function pick(opt: number) {
    setAnswers((a) => ({ ...a, [q.id]: opt }))
  }

  function next() {
    if (isLast) {
      const level = scoreQuiz(answers)
      onResult(level)
    } else {
      setIdx(idx + 1)
    }
  }

  return (
    <Shell
      title={`Pergunta ${idx + 1} de ${QUIZ_QUESTIONS.length}`}
      subtitle="Sem pegadinhas, escolha o que faz mais sentido pra você."
      hideNext
      hidePrev
    >
      <div className="space-y-4 mt-4">
        <p className="font-medium text-lg">{q.question}</p>
        <div className="grid gap-2">
          {q.options.map((o, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={cn(
                'text-left rounded-xl border bg-card p-4 transition',
                selected === i ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={next} disabled={selected === undefined}>
            {isLast ? 'Ver resultado' : 'Próxima'}
          </Button>
        </div>
      </div>
    </Shell>
  )
}
```

- [ ] **Step 6: Validar**

`npm run dev` →
- Step seniority → escolhe "Selecionar manualmente" → 4 cards → seleciona → continuar.
- Voltar → escolhe "Fazer quiz" → 8 perguntas → resultado → tela manual mostra escolha pré-marcada com hint do quiz.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(onboarding): step seniority manual + quiz"
```

**Critério aceite:** Quiz funciona ponta-a-ponta. Testes scoreQuiz passam (3/3).

---

### Task 14: Step ProviderDetect (escolha CLI padrão)

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/ProviderDetect.tsx`
- Create: `src/renderer/src/components/ProviderCard.tsx`

- [ ] **Step 1: ProviderCard**

`src/renderer/src/components/ProviderCard.tsx`:

```tsx
import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProviderId, ProviderStatus } from '@shared/providers'
import { PROVIDER_META } from '@shared/providers'

interface Props {
  id: ProviderId
  status: ProviderStatus | undefined
  loading?: boolean
  selected?: boolean
  onSelect?: () => void
  disabled?: boolean
}

export function ProviderCard({ id, status, loading, selected, onSelect, disabled }: Props) {
  const meta = PROVIDER_META[id]
  const installed = status?.installed
  return (
    <button
      onClick={onSelect}
      disabled={disabled || !installed}
      className={cn(
        'w-full text-left rounded-xl border bg-card p-4 transition flex items-start gap-3',
        selected && 'border-primary ring-2 ring-primary/30',
        !selected && !disabled && installed && 'border-border hover:bg-accent',
        !installed && 'border-border opacity-60 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'mt-1 size-7 rounded-full flex items-center justify-center shrink-0',
          installed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : installed ? <Check className="size-4" /> : <X className="size-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{meta.label}</span>
          {status?.version && (
            <span className="text-[10px] font-mono text-muted-foreground">v{status.version}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
        {!installed && (
          <a
            href={meta.homepage}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline"
          >
            Instalar <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Step**

`src/renderer/src/pages/Onboarding/steps/ProviderDetect.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PROVIDER_IDS, type ProviderId, type ProviderStatus } from '@shared/providers'
import { ProviderCard } from '@/components/ProviderCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'

export default function ProviderDetect() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const [status, setStatus] = useState<Record<ProviderId, ProviderStatus> | null>(null)
  const [loading, setLoading] = useState(true)

  async function detect() {
    setLoading(true)
    const r = await window.api.invoke('providers:detect', undefined)
    setStatus(r)
    setLoading(false)
    // se ainda não escolheu nada e a default não tá instalada, sugere a primeira instalada
    const cur = draft.provider_default
    if (!cur || !r[cur].installed) {
      const firstInstalled = PROVIDER_IDS.find((id) => r[id].installed)
      if (firstInstalled) setDraft('provider_default', firstInstalled)
    }
  }

  useEffect(() => {
    detect()
  }, [])

  const installedCount = status ? Object.values(status).filter((s) => s.installed).length : 0
  const canContinue = !!draft.provider_default && status?.[draft.provider_default!].installed

  return (
    <Shell
      title="Qual IA você usa?"
      subtitle="Procurei pelos CLIs no seu PATH. Clique pra escolher o padrão."
      nextDisabled={!canContinue}
    >
      <div className="flex items-center justify-between mb-3 mt-4">
        <span className="text-xs text-muted-foreground">
          {loading ? 'Procurando…' : `${installedCount} de ${PROVIDER_IDS.length} encontrados`}
        </span>
        <Button variant="ghost" size="sm" onClick={detect} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <RefreshCw className="size-3.5 mr-1" />}
          Reescanear
        </Button>
      </div>
      <div className="grid gap-2">
        {PROVIDER_IDS.map((id) => (
          <ProviderCard
            key={id}
            id={id}
            status={status?.[id]}
            loading={loading}
            selected={draft.provider_default === id}
            onSelect={() => setDraft('provider_default', id)}
          />
        ))}
      </div>
      {!loading && installedCount === 0 && (
        <Alert className="mt-4">
          <AlertDescription>
            Nenhuma CLI encontrada. Instale pelo menos uma (links acima) e clique "Reescanear".
          </AlertDescription>
        </Alert>
      )}
    </Shell>
  )
}
```

- [ ] **Step 3: Validar**

`npm run dev` → step providers → vê 5 cards, ✓ nas instaladas. Selecionar uma → continuar habilita.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(onboarding): step provider detect + escolha"
```

**Critério aceite:** Status correto pelas 3 CLIs do user instaladas + seleção persiste no store.

---

### Task 15: Step ProviderTest (envia "ok" e valida)

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/ProviderTest.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PROVIDER_META } from '@shared/providers'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Phase = 'idle' | 'running' | 'ok' | 'error'

export default function ProviderTest() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const id = draft.provider_default!
  const meta = PROVIDER_META[id]

  const [phase, setPhase] = useState<Phase>('idle')
  const [latency, setLatency] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setPhase('running')
    setError(null)
    const r = await window.api.invoke('providers:test', { id })
    setLatency(r.latencyMs)
    if (r.ok) {
      setPhase('ok')
      const tested = { ...(draft.provider_tested ?? {}), [id]: true }
      setDraft('provider_tested', tested)
    } else {
      setPhase('error')
      setError(r.error ?? 'erro desconhecido')
    }
  }

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <Shell
      title="Validando conexão"
      subtitle={`Mando "responda ok" pro ${meta.label} e confiro.`}
      nextDisabled={phase === 'running'}
    >
      <div className="rounded-xl border border-border bg-card p-6 mt-4 flex items-center gap-4">
        {phase === 'running' && <Loader2 className="size-7 animate-spin text-primary" />}
        {phase === 'ok' && <CheckCircle2 className="size-7 text-green-500" />}
        {phase === 'error' && <XCircle className="size-7 text-destructive" />}
        <div className="flex-1">
          <div className="font-medium">{meta.label}</div>
          {phase === 'running' && <p className="text-sm text-muted-foreground">Aguardando resposta…</p>}
          {phase === 'ok' && <p className="text-sm text-muted-foreground">Funcionou em {(latency / 1000).toFixed(1)}s.</p>}
          {phase === 'error' && <p className="text-sm text-destructive">{error}</p>}
        </div>
        {phase !== 'running' && (
          <Button variant="ghost" size="sm" onClick={run}>
            <RefreshCw className="size-3.5 mr-1" />
            Tentar de novo
          </Button>
        )}
      </div>

      {phase === 'error' && (
        <Alert className="mt-4">
          <AlertDescription className="text-xs">
            Algumas causas comuns:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>CLI precisa de login (rode <code className="font-mono">{meta.binaryName} login</code> no terminal)</li>
              <li>Conta sem créditos / API key expirada</li>
              <li>Sem internet</li>
            </ul>
            Você pode pular e configurar depois nas Settings.
          </AlertDescription>
        </Alert>
      )}
    </Shell>
  )
}
```

- [ ] **Step 2: Permitir continuar mesmo com erro**

Ajustar header — `nextDisabled` só durante `running`, não em `error`. Já está acima.

- [ ] **Step 3: Validar**

`npm run dev` → escolha claude na step anterior → essa step roda automaticamente → mostra spinner → ✓ verde + tempo. Repetir com codex/gemini.

Forçar erro: desinstalar temporariamente o CLI ou mudar binário inexistente — não dá pra testar facilmente, mas logicamente o caminho ✗ existe.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(onboarding): step test conexão cli"
```

**Critério aceite:** Roda automaticamente, mostra latência, permite continuar mesmo após erro.

---

### Task 16: Step Theme

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Theme.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string; desc: string }[] = [
  { value: 'auto', icon: Monitor, label: 'Sistema', desc: 'Segue o tema do seu SO.' },
  { value: 'dark', icon: Moon, label: 'Escuro', desc: 'Sempre escuro.' },
  { value: 'light', icon: Sun, label: 'Claro', desc: 'Sempre claro.' }
]

export default function Theme() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const { setTheme } = useTheme()

  return (
    <Shell title="Tema" subtitle="Pode trocar a qualquer momento depois.">
      <div className="grid gap-2 mt-4">
        {OPTIONS.map(({ value, icon: Icon, label, desc }) => {
          const selected = draft.theme === value
          return (
            <button
              key={value}
              onClick={() => {
                setDraft('theme', value)
                setTheme(value)
              }}
              className={cn(
                'flex items-center gap-3 text-left rounded-xl border bg-card p-4 transition',
                selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
              )}
            >
              <Icon className="size-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Validar**

`npm run dev` → step theme → clicar muda tema na hora.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(onboarding): step tema"
```

**Critério aceite:** Mudança de tema é instantânea, persiste na próxima step.

---

### Task 17: Step Workspace (escolher pasta — opcional)

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Workspace.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { Button } from '@/components/ui/button'
import { Folder, FolderOpen } from 'lucide-react'

export default function Workspace() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const path = draft.last_workspace ?? null

  async function pick() {
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) setDraft('last_workspace', r.path)
  }

  return (
    <Shell
      title="Abrir um projeto?"
      subtitle="Você pode pular e abrir depois pelo menu."
      nextLabel={path ? 'Continuar' : 'Pular por agora'}
    >
      <div className="mt-4 space-y-3">
        <button
          onClick={pick}
          className="w-full rounded-xl border border-dashed border-border bg-card hover:bg-accent transition p-8 flex flex-col items-center gap-2 text-center"
        >
          <FolderOpen className="size-8 text-primary" />
          <div className="font-medium">Escolher pasta</div>
          <p className="text-xs text-muted-foreground">
            Aponta pra raiz de um repo git (com `.git/` dentro)
          </p>
        </button>
        {path && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2 text-sm">
            <Folder className="size-4 text-primary" />
            <span className="font-mono text-xs flex-1 truncate" title={path}>{path}</span>
            <Button variant="ghost" size="sm" onClick={() => setDraft('last_workspace', null)}>
              Limpar
            </Button>
          </div>
        )}
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Validar**

`npm run dev` → step workspace → clicar "Escolher pasta" → diálogo nativo abre → escolhe pasta → mostra path. Botão "Limpar" remove.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(onboarding): step workspace picker"
```

**Critério aceite:** Picker funciona, path mostrado, opção de limpar.

---

### Task 18: Step Summary (revisa tudo + persiste)

**Files:**
- Modify: `src/renderer/src/pages/Onboarding/steps/Summary.tsx`

- [ ] **Step 1: Implementar**

```tsx
import { useNavigate } from 'react-router-dom'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { SENIORITY_LABELS } from '@shared/seniority'
import { PROVIDER_META } from '@shared/providers'
import { Check, User, GraduationCap, Bot, Palette, Folder } from 'lucide-react'

export default function Summary() {
  const draft = useOnboarding((s) => s.draft)
  const reset = useOnboarding((s) => s.reset)
  const navigate = useNavigate()

  const items = [
    { icon: User, label: 'Nome', value: draft.user_name },
    {
      icon: GraduationCap,
      label: 'Senioridade',
      value: `${SENIORITY_LABELS[draft.seniority!]} ${draft.seniority_source === 'quiz' ? '(via quiz)' : ''}`
    },
    {
      icon: Bot,
      label: 'IA padrão',
      value: PROVIDER_META[draft.provider_default!].label
    },
    {
      icon: Palette,
      label: 'Tema',
      value: draft.theme === 'auto' ? 'Sistema' : draft.theme === 'dark' ? 'Escuro' : 'Claro'
    },
    {
      icon: Folder,
      label: 'Workspace',
      value: draft.last_workspace ?? '—'
    }
  ]

  async function finalize() {
    await window.api.invoke('settings:set', { key: 'user_name', value: draft.user_name! })
    await window.api.invoke('settings:set', { key: 'seniority', value: draft.seniority! })
    await window.api.invoke('settings:set', { key: 'seniority_source', value: draft.seniority_source! })
    await window.api.invoke('settings:set', { key: 'provider_default', value: draft.provider_default! })
    await window.api.invoke('settings:set', { key: 'provider_tested', value: draft.provider_tested ?? {} })
    await window.api.invoke('settings:set', { key: 'theme', value: draft.theme! })
    await window.api.invoke('settings:set', { key: 'last_workspace', value: draft.last_workspace ?? null })
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: true })
    reset()
    navigate('/home', { replace: true })
  }

  return (
    <Shell
      title="Tudo certo?"
      subtitle="Confere as escolhas — sempre dá pra mudar nas Settings."
      onNext={finalize}
      nextLabel="Concluir e abrir DevSenses"
      hideNext={false}
    >
      <div className="mt-4 rounded-xl border border-border bg-card divide-y divide-border">
        {items.map((it) => (
          <div key={it.label} className="p-4 flex items-center gap-3">
            <it.icon className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-32">{it.label}</span>
            <span className="text-sm font-medium flex-1 truncate" title={String(it.value)}>
              {it.value || '—'}
            </span>
            <Check className="size-4 text-green-500" />
          </div>
        ))}
      </div>
    </Shell>
  )
}
```

- [ ] **Step 2: Validar fluxo completo**

`npm run dev` →
- Limpar DB pra simular primeira vez:
  ```bash
  rm ~/Library/Application\ Support/devsenses/devsenses.db
  ```
- Reabrir app → onboarding desde welcome
- Preencher os 8 steps até summary
- Clicar "Concluir" → vai pra `/home` com saudação usando o nome
- Fechar e reabrir → vai direto pra `/home` (não pede onboarding de novo)

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(onboarding): step summary + finalização persistindo todas settings"
```

**Critério aceite:** Fluxo end-to-end fecha o ciclo, settings persistem, segunda execução pula onboarding.

---

### Task 19: Tela Home + skip onboarding com aviso

**Files:**
- Modify: `src/renderer/src/pages/Home/index.tsx`
- Modify: `src/renderer/src/pages/Onboarding/Shell.tsx` (adicionar botão "pular tudo")

- [ ] **Step 1: Adicionar botão "pular onboarding"**

`src/renderer/src/pages/Onboarding/Shell.tsx` — adicionar prop `showSkip` e UI:

```tsx
// adicionar imports
import { useNavigate } from 'react-router-dom'

// dentro do componente
const navigate = useNavigate()

async function skipAll() {
  const ok = window.confirm(
    'DevSenses funciona melhor configurado.\n\nPular significa: nenhuma CLI selecionada (não vai analisar diff), modo júnior default.\n\nContinuar mesmo assim?'
  )
  if (!ok) return
  await window.api.invoke('settings:set', { key: 'onboarding_completed', value: true })
  navigate('/home', { replace: true })
}
```

E adicionar no canto superior direito da Shell:

```tsx
<div className="px-10 pt-8 flex items-center gap-4">
  <OnboardingProgress current={step} />
  <button
    onClick={skipAll}
    className="text-xs text-muted-foreground hover:text-foreground"
  >
    Pular
  </button>
</div>
```

- [ ] **Step 2: Home mais bonita**

`src/renderer/src/pages/Home/index.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Folder, Settings as SettingsIcon, FolderOpen } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const { value: name } = useSettings('user_name')
  const navigate = useNavigate()
  const [recents, setRecents] = useState<{ path: string; name: string; lastOpenedAt: number }[]>([])

  useEffect(() => {
    window.api.invoke('workspace:recent', undefined).then(setRecents)
  }, [])

  async function pick() {
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) {
      // navigate quando Fase 2 implementar /workspace/:path
      console.log('selected', r)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="font-semibold">DevSenses</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <SettingsIcon className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          E aí, {name || 'dev'}
        </h1>
        <p className="text-muted-foreground mb-8">
          Abre um projeto pra começar. O Diff Reviewer (Fase 2) vai entrar aqui.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Abrir projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={pick} className="gap-2">
              <FolderOpen className="size-4" />
              Escolher pasta
            </Button>
          </CardContent>
        </Card>

        {recents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recentes</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {recents.map((r) => (
                <button
                  key={r.path}
                  onClick={() => console.log('open', r.path)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-accent rounded -mx-3 px-3"
                >
                  <Folder className="size-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{r.path}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Validar**

`npm run dev` →
- Pular no onboarding → confirm → vai pra home com nome vazio
- Abrir projeto → workspace:pickFolder ok
- Card "Recentes" aparece com pastas selecionadas

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: home placeholder + skip onboarding com confirm"
```

**Critério aceite:** Home renderiza, recents da DB, skip funciona com aviso.

---

### Task 20: Settings page (4 seções + refazer onboarding)

**Files:**
- Create: `src/renderer/src/pages/Settings/index.tsx`
- Create: `src/renderer/src/pages/Settings/Profile.tsx`
- Create: `src/renderer/src/pages/Settings/AI.tsx`
- Create: `src/renderer/src/pages/Settings/Appearance.tsx`
- Create: `src/renderer/src/pages/Settings/Workspace.tsx`
- Modify: `src/renderer/src/routes.tsx`

- [ ] **Step 1: Settings shell**

`src/renderer/src/pages/Settings/index.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User, Bot, Palette, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import Profile from './Profile'
import AI from './AI'
import Appearance from './Appearance'
import Workspace from './Workspace'

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User, component: Profile },
  { id: 'ai', label: 'IA', icon: Bot, component: AI },
  { id: 'appearance', label: 'Aparência', icon: Palette, component: Appearance },
  { id: 'workspace', label: 'Workspace', icon: Folder, component: Workspace }
] as const

export default function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('profile')
  const navigate = useNavigate()
  const Active = TABS.find((t) => t.id === tab)!.component

  return (
    <div className="h-full flex">
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            <ChevronLeft className="size-4 mr-1" /> Voltar
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition',
                tab === t.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto px-10 py-8">
        <Active />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Profile**

`src/renderer/src/pages/Settings/Profile.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SENIORITY_LABELS, type SeniorityLevel } from '@shared/seniority'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ORDER: SeniorityLevel[] = ['intern', 'junior', 'mid', 'senior']

export default function Profile() {
  const { value: name, setValue: setName } = useSettings('user_name')
  const { value: seniority, setValue: setSeniority } = useSettings('seniority')
  const navigate = useNavigate()

  async function refazerCompleto() {
    const ok = window.confirm('Isso zera todas suas preferências e roda o onboarding desde o início. Continuar?')
    if (!ok) return
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: false })
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Perfil</h1>

      <div className="space-y-2 mb-6">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2 mb-6">
        <Label>Senioridade</Label>
        <div className="grid grid-cols-2 gap-2">
          {ORDER.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeniority(lvl)}
              className={cn(
                'rounded-md border bg-card px-3 py-2 text-sm text-left transition',
                seniority === lvl ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
              )}
            >
              {SENIORITY_LABELS[lvl]}
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      <Alert>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span className="text-xs">Quer refazer todo o onboarding (incluindo o quiz)?</span>
          <Button size="sm" variant="outline" onClick={refazerCompleto}>
            Refazer onboarding
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
```

- [ ] **Step 3: AI**

`src/renderer/src/pages/Settings/AI.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderCard } from '@/components/ProviderCard'
import { PROVIDER_IDS, type ProviderId, type ProviderStatus, PROVIDER_META } from '@shared/providers'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

export default function AI() {
  const { value: defaultId, setValue: setDefault } = useSettings('provider_default')
  const [status, setStatus] = useState<Record<ProviderId, ProviderStatus> | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<ProviderId | null>(null)

  async function detect() {
    setLoading(true)
    const r = await window.api.invoke('providers:detect', undefined)
    setStatus(r)
    setLoading(false)
  }

  useEffect(() => { detect() }, [])

  async function retest(id: ProviderId) {
    setTesting(id)
    const r = await window.api.invoke('providers:test', { id })
    setTesting(null)
    if (r.ok) {
      window.alert(`✓ ${PROVIDER_META[id].label} respondeu em ${(r.latencyMs / 1000).toFixed(1)}s`)
    } else {
      window.alert(`✗ ${PROVIDER_META[id].label} falhou: ${r.error}`)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">IA</h1>
        <Button variant="ghost" size="sm" onClick={detect} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <RefreshCw className="size-3.5 mr-1" />}
          Reescanear
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        CLI padrão usada pelo Diff Reviewer. Clica numa instalada pra setar como padrão.
      </p>

      <div className="grid gap-2">
        {PROVIDER_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2">
            <div className="flex-1">
              <ProviderCard
                id={id}
                status={status?.[id]}
                loading={loading}
                selected={defaultId === id}
                onSelect={() => setDefault(id)}
              />
            </div>
            {status?.[id].installed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => retest(id)}
                disabled={testing !== null}
              >
                {testing === id ? <Loader2 className="size-3 animate-spin" /> : 'Testar'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Appearance**

`src/renderer/src/pages/Settings/Appearance.tsx`:

```tsx
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'auto', label: 'Sistema', icon: Monitor },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun }
]

export default function Appearance() {
  const { value, setValue } = useSettings('theme')
  const { setTheme } = useTheme()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Aparência</h1>

      <div className="grid gap-2">
        {OPTIONS.map(({ value: opt, label, icon: Icon }) => (
          <button
            key={opt}
            onClick={() => {
              setValue(opt)
              setTheme(opt)
            }}
            className={cn(
              'flex items-center gap-3 text-left rounded-xl border bg-card p-4 transition',
              value === opt ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
            )}
          >
            <Icon className="size-5 text-primary" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Workspace**

`src/renderer/src/pages/Settings/Workspace.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Folder, Trash2 } from 'lucide-react'

export default function Workspace() {
  const [recents, setRecents] = useState<{ path: string; name: string; lastOpenedAt: number }[]>([])

  async function load() {
    const r = await window.api.invoke('workspace:recent', undefined)
    setRecents(r)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Workspace</h1>

      <h2 className="text-sm font-medium mb-2">Pastas recentes</h2>
      {recents.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma pasta aberta ainda.</p>
      )}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {recents.map((r) => (
          <div key={r.path} className="p-3 flex items-center gap-3">
            <Folder className="size-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{r.path}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Adicionar rota**

`src/renderer/src/routes.tsx`:

```tsx
import Settings from './pages/Settings'
// ...
export const router = createHashRouter([
  { path: '/', element: <FirstLaunchGate /> },
  { path: '/onboarding/*', element: <Onboarding /> },
  { path: '/home', element: <Home /> },
  { path: '/settings', element: <Settings /> }
])
```

- [ ] **Step 7: Validar**

`npm run dev` → Home → ícone settings → Settings page → 4 abas funcionam → "Refazer onboarding" zera + redireciona pra `/onboarding`.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: settings page com 4 abas + refazer onboarding"
```

**Critério aceite:** 4 abas editam settings, refazer onboarding zera flag e navega.

---

### Task 21: Build pipeline (DMG mac + EXE windows)

**Files:**
- Create: `electron-builder.yml`
- Create: `resources/icon.icns` (mac), `resources/icon.ico` (win), `resources/icon.png` (linux/fallback)
- Modify: `package.json` (scripts build)

- [ ] **Step 1: Gerar ícones**

Por ora usa um placeholder (1 PNG quadrado >= 512×512). Pra macOS converter pra `.icns`:

```bash
# usa ferramentas built-in macOS
mkdir -p resources/icon.iconset
sips -z 16 16     resources/icon.png --out resources/icon.iconset/icon_16x16.png
sips -z 32 32     resources/icon.png --out resources/icon.iconset/icon_16x16@2x.png
sips -z 32 32     resources/icon.png --out resources/icon.iconset/icon_32x32.png
sips -z 64 64     resources/icon.png --out resources/icon.iconset/icon_32x32@2x.png
sips -z 128 128   resources/icon.png --out resources/icon.iconset/icon_128x128.png
sips -z 256 256   resources/icon.png --out resources/icon.iconset/icon_128x128@2x.png
sips -z 256 256   resources/icon.png --out resources/icon.iconset/icon_256x256.png
sips -z 512 512   resources/icon.png --out resources/icon.iconset/icon_256x256@2x.png
sips -z 512 512   resources/icon.png --out resources/icon.iconset/icon_512x512.png
cp resources/icon.png resources/icon.iconset/icon_512x512@2x.png
iconutil -c icns resources/icon.iconset -o resources/icon.icns
rm -rf resources/icon.iconset
```

Pra `.ico` Windows: usar conversor online (icoconvert.com) ou ImageMagick:

```bash
brew install imagemagick
magick convert resources/icon.png -define icon:auto-resize=256,128,64,32,16 resources/icon.ico
```

Se ImageMagick não disponível, deixa apenas `.icns` e `.png` — Windows aceita PNG fallback.

- [ ] **Step 2: electron-builder.yml**

```yaml
appId: com.luccas.devsenses
productName: DevSenses
directories:
  buildResources: resources
  output: release
files:
  - "out/**/*"
  - "package.json"
extraResources:
  - from: "src/main/db/migrations"
    to: "db/migrations"
    filter: ["**/*.sql"]
mac:
  category: public.app-category.developer-tools
  target:
    - dmg
  icon: resources/icon.icns
  hardenedRuntime: false
  gatekeeperAssess: false
  identity: null   # build não-assinado fase 1
win:
  target:
    - nsis
  icon: resources/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  perMachine: false
linux:
  target:
    - AppImage
  icon: resources/icon.png
  category: Development
```

- [ ] **Step 3: Scripts**

`package.json`:

```json
{
  "scripts": {
    "build": "npm run typecheck && electron-vite build",
    "build:mac": "npm run build && electron-builder --mac",
    "build:win": "npm run build && electron-builder --win",
    "build:linux": "npm run build && electron-builder --linux",
    "build:unpack": "npm run build && electron-builder --dir",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json --composite false",
    "typecheck": "npm run typecheck:node && npm run typecheck:web"
  }
}
```

- [ ] **Step 4: Build mac**

```bash
npm run build:mac
```

Esperado: gera `release/DevSenses-0.0.1.dmg` (~150MB). Demora 1-3min.

Abrir o `.dmg`, arrastar app pra Applications, abrir. macOS pode reclamar "app não verificado" — System Settings → Privacy → permitir manualmente (build não-assinado fase 1).

- [ ] **Step 5: Migration path em produção**

No build, `migrationsDir()` aponta pra `__dirname/migrations`, que vira `out/main/db/migrations` no bundle e depois `app.getAppPath()/.../migrations` empacotado. Mas `extraResources` copia pra `process.resourcesPath/db/migrations`.

Ajustar `src/main/db/migrations.ts` `migrationsDir()`:

```ts
import { app } from 'electron'

export function migrationsDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'db', 'migrations')
  }
  return join(__dirname, 'migrations')
}
```

E em `electron.vite.config.ts` parar de copiar com `vite-plugin-static-copy` (era pra dev). Em vez disso, adicionar copia pra `out/main/db/migrations` em dev manualmente:

Atualizar `viteStaticCopy` config — manter, copia pra `out/main/db/migrations` no dev. Em produção `extraResources` (electron-builder.yml) copia pra `resources/db/migrations`. `migrationsDir()` checa `app.isPackaged`.

- [ ] **Step 6: Smoke test produção**

Abrir o app empacotado:
- Onboarding aparece (DB criado em `~/Library/Application Support/DevSenses/devsenses.db`)
- Detectar CLIs ainda funciona (subprocess herda PATH do shell em macOS — pode falhar em Win se PATH não tiver claude/etc; mas usuário tem instalado globalmente, deve achar).

Se CLI não for encontrada no app empacotado mas funciona no `npm run dev`:
- macOS: PATH limitado em apps `.app`. Solução = ler `~/.zshrc`/`.bashrc` no main e injetar PATH. Adicionar fix:

`src/main/utils/path-fix.ts` (criar):

```ts
import { spawnSync } from 'child_process'

export function ensureFullPath(): void {
  if (process.platform !== 'darwin') return
  const shell = process.env.SHELL ?? '/bin/zsh'
  const result = spawnSync(shell, ['-l', '-c', 'echo $PATH'], { encoding: 'utf-8' })
  if (result.status === 0 && result.stdout.trim()) {
    process.env.PATH = result.stdout.trim()
  }
}
```

Chamar em `src/main/index.ts` antes de `app.whenReady()`:

```ts
import { ensureFullPath } from './utils/path-fix'
ensureFullPath()
```

- [ ] **Step 7: Build Windows (opcional fase 1)**

Cross-build do mac → win normalmente requer Wine. Pra fase 1, pular e deixar pra rodar em Windows real depois. Adicionar nota no README.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: build pipeline electron-builder + path fix macos + icons"
```

**Critério aceite:** `.dmg` gerado, app abre, onboarding roda, detecta CLIs no app empacotado.

---

# Self-Review Checklist

Antes de fechar a Fase 1, conferir:

- [ ] Todos os 8 steps do onboarding renderizam sem erro
- [ ] Voltar/Avançar entre steps preserva `draft` no zustand
- [ ] Quiz seniority calcula nível corretamente (3 testes passam)
- [ ] CLIs instaladas (claude/codex/gemini) detectadas com versão
- [ ] CLI selecionada testa com sucesso (responde "ok")
- [ ] Tema dark/light/auto funciona + persiste
- [ ] Workspace pickFolder abre diálogo nativo
- [ ] Summary persiste TODAS as 8 chaves no SQLite
- [ ] Reabrir app pula onboarding (vai pra `/home`)
- [ ] Settings: 4 abas editam settings e mudanças persistem
- [ ] Settings: "Refazer onboarding" zera flag + navega
- [ ] `npm test` passa (5 + 6 + 2 + 3 = 16 testes)
- [ ] `npm run typecheck` passa sem erro
- [ ] `npm run build:mac` gera DMG funcional
- [ ] Migrations rodam idempotentes em primeira/segunda execução
- [ ] Console renderer DevTools sem warnings de prop não tipada

# Notas pra Fases Futuras

**Fase 2 — Diff Reviewer (próximo plano):**
- Worktree de `simple-git` lendo working dir + index + untracked
- Layout 3 painéis (file list / diff / IA painel) com `react-resizable-panels`
- Painel IA com sub-tabs (Resumo / Conceitos / Crítica)
- File watcher (chokidar) + debounce 400ms
- Prompt builder por senioridade (consume `seniority` do settings)
- Streaming providers:invoke (já implementado nessa Fase 1)
- Glossário pessoal (tabelas `concepts` + `user_seen_concepts` já criadas)

**Fase 3 — Browser Tester:**
- Adicionar `playwright` como dependency
- Detector de URL local lendo `package.json` do workspace
- Painel "Testes IA" com prompt natural
- Slider chaos / sane / nuclear
- Replay video + screenshots em `~/.devsenses/runs/`

**Fase 4 — Pixel-art module:**
- Modular em `src/renderer/src/modules/pixelart/`
- Sprite sheet animations
- Integração com providers ativos pra "fala IA pixel-art"

# Handoff

Plano completo. Ao executar:

1. Cada Task é independente — faz commit ao fim de cada uma.
2. Se um Task falhar, NÃO segue pro próximo — investiga + corrige.
3. Testes (Vitest) ficam verdes em todos os pontos.
4. App roda (`npm run dev`) ao final de cada Task.
5. NÃO commita se algo está quebrado.
