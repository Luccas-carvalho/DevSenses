# DevSenses Web Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **CRITICAL — User preference:** Do NOT run `git commit` automatically. After completing each task, stage with `git add` only and report status to user. User will commit manually when ready. This overrides default TDD-frequent-commit guidance.

**Goal:** Build single-page marketing landing for DevSenses in `web/` subdir of monorepo. Next.js 15 + Tailwind 4 + shadcn + framer-motion + next-intl + magicui + next-themes. Dark/light themes with primary `#6618ed`. PT/EN i18n namespaced (não monolítico). Provocative copy, high-tech animations, waitlist capture + GitHub link.

**Architecture:** Monorepo via npm workspaces — root `DevSenses/package.json` adds `"workspaces": ["web"]`. App Electron continues independent. Site runs via `cd web && npm run dev`. Hybrid SSR — server components for content (SEO), client components only for interactive bits (theme toggle, forms, animations). Reference design spec: `docs/superpowers/specs/2026-05-05-web-landing-page-design.md`.

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 (CSS-first config) + shadcn/ui
- next-intl 3 (i18n)
- next-themes (theme persistence)
- framer-motion 12 (animations)
- magicui (animated-theme-toggler)
- Geist font (sans + mono)
- Lenis (smooth scroll, optional)
- Resend (waitlist provider, default — trocável)

---

## Estrutura final de arquivos

```
DevSenses/
├── package.json                       # MODIFICAR: add "workspaces": ["web"]
└── web/                               # NOVO subdir
    ├── app/
    │   ├── [locale]/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── opengraph-image.tsx
    │   │   └── not-found.tsx
    │   ├── api/waitlist/route.ts
    │   ├── globals.css
    │   ├── layout.tsx                 # root layout (html/body)
    │   └── favicon.ico
    ├── components/
    │   ├── sections/
    │   │   ├── hero.tsx
    │   │   ├── pain.tsx
    │   │   ├── solution.tsx
    │   │   ├── features.tsx
    │   │   ├── how-it-works.tsx
    │   │   ├── providers.tsx
    │   │   ├── pricing.tsx
    │   │   ├── faq.tsx
    │   │   └── footer.tsx
    │   ├── ui/                        # shadcn primitives
    │   ├── magicui/animated-theme-toggler.tsx
    │   ├── layout/header.tsx
    │   ├── layout/language-switcher.tsx
    │   ├── animations/
    │   │   ├── fade-in.tsx
    │   │   ├── stagger.tsx
    │   │   └── gradient-blob.tsx
    │   ├── theme-provider.tsx
    │   ├── waitlist-form.tsx
    │   ├── animated-diff-demo.tsx
    │   └── lenis-provider.tsx
    ├── messages/
    │   ├── en/{common,hero,pain,solution,features,how-it-works,providers,pricing,faq,footer}.json
    │   └── pt/{common,hero,pain,solution,features,how-it-works,providers,pricing,faq,footer}.json
    ├── i18n/
    │   ├── routing.ts
    │   └── request.ts
    ├── lib/
    │   ├── cn.ts
    │   └── waitlist.ts
    ├── public/
    │   ├── icon.svg
    │   └── og-image.png
    ├── middleware.ts
    ├── components.json
    ├── next.config.ts
    ├── tailwind.config.ts             # opcional Tailwind 4 (config via CSS principalmente)
    ├── tsconfig.json
    ├── package.json
    └── .env.local.example
```

---

## Fase 0: Monorepo + scaffold (Task 1-4)

### Task 1: Configurar npm workspaces na raiz

**Files:**
- Modify: `package.json` (root DevSenses)

- [ ] **Step 1: Read current root package.json**

```bash
cat /Users/luccas/Documents/Github/DevSenses/package.json
```

Confirm exists, note current scripts/deps.

- [ ] **Step 2: Add workspaces field**

Edit `/Users/luccas/Documents/Github/DevSenses/package.json` — add `"workspaces": ["web"]` after `"main"` field:

```json
{
  "name": "devsenses",
  "version": "0.0.1",
  "description": "DevSenses — IDE com IA educacional",
  "main": "./out/main/index.js",
  "workspaces": ["web"],
  "author": "Luccas Carvalho",
  ...
}
```

- [ ] **Step 3: Verify npm recognizes workspace**

Run from root:
```bash
cd /Users/luccas/Documents/Github/DevSenses && npm pkg get workspaces
```

Expected output: `["web"]`

- [ ] **Step 4: Stage changes (do NOT commit)**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add package.json
```

Report to user: "Workspaces configured. Awaiting commit approval."

---

### Task 2: Scaffold Next.js 15 em web/

**Files:**
- Create: `web/` (entire subdirectory via create-next-app)

- [ ] **Step 1: Run create-next-app**

```bash
cd /Users/luccas/Documents/Github/DevSenses && npx create-next-app@15 web --typescript --tailwind --app --src-dir=false --import-alias "@/*" --no-eslint --use-npm --turbopack
```

Choose interactively if prompted:
- TypeScript: Yes
- ESLint: No
- Tailwind: Yes
- `src/`: No
- App Router: Yes
- Turbopack: Yes
- Import alias: `@/*`

- [ ] **Step 2: Verify structure**

```bash
ls /Users/luccas/Documents/Github/DevSenses/web/
```

Expected files: `app/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` (or no tailwind config — Tailwind 4 uses CSS).

- [ ] **Step 3: Run dev server to verify scaffold works**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm run dev
```

Expected: server starts on `http://localhost:3000`. Visit, see Next default page. Stop with Ctrl+C.

- [ ] **Step 4: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/
```

---

### Task 3: Limpar boilerplate Next + setup base

**Files:**
- Modify: `web/app/page.tsx`
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`
- Delete: `web/public/next.svg`, `web/public/vercel.svg`, `web/public/file.svg`, `web/public/globe.svg`, `web/public/window.svg`

- [ ] **Step 1: Replace `web/app/page.tsx` with minimal placeholder**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">DevSenses</h1>
    </main>
  )
}
```

- [ ] **Step 2: Replace `web/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevSenses',
  description: 'Vire dev. Não operador.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Install Geist font package**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm install geist
```

- [ ] **Step 4: Replace `web/app/globals.css` with Tailwind 4 base + theme vars**

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-primary: #6618ed;
  --color-primary-foreground: #ffffff;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #71717a;
  --border: #e5e5e5;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --border: #27272a;
}

@variant dark (&:where(.dark, .dark *));

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 5: Delete unused public assets**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web/public && rm -f next.svg vercel.svg file.svg globe.svg window.svg
```

- [ ] **Step 6: Verify build still works**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm run dev
```

Expected: page shows "DevSenses" centered. Stop server.

- [ ] **Step 7: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/
```

---

### Task 4: Setup shadcn/ui

**Files:**
- Create: `web/components.json`
- Create: `web/lib/cn.ts`
- Create: `web/components/ui/` (vazio inicial)

- [ ] **Step 1: Init shadcn**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npx shadcn@latest init
```

Choose:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

This creates `components.json`, `lib/utils.ts` (rename later), updates `globals.css`.

- [ ] **Step 2: Create `web/lib/cn.ts` (override default `lib/utils.ts`)**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Update `components.json` to point at `lib/cn.ts`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui"
  }
}
```

- [ ] **Step 4: Delete generated `lib/utils.ts` if exists**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && rm -f lib/utils.ts
```

- [ ] **Step 5: Add base shadcn components needed**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npx shadcn@latest add button card input accordion badge dropdown-menu
```

- [ ] **Step 6: Verify components installed**

```bash
ls /Users/luccas/Documents/Github/DevSenses/web/components/ui/
```

Expected: `button.tsx`, `card.tsx`, `input.tsx`, `accordion.tsx`, `badge.tsx`, `dropdown-menu.tsx`.

- [ ] **Step 7: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/
```

---

## Fase 1: i18n + Theming (Task 5-10)

### Task 5: Instalar next-intl + dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install next-intl**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm install next-intl
```

- [ ] **Step 2: Install next-themes + framer-motion + lenis**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm install next-themes framer-motion lenis
```

- [ ] **Step 3: Verify deps**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm pkg get dependencies
```

Expected: `next-intl`, `next-themes`, `framer-motion`, `lenis`, `geist` present.

- [ ] **Step 4: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/package.json web/package-lock.json
```

---

### Task 6: Criar estrutura de messages/ (i18n namespaced)

**Files:**
- Create: `web/messages/en/common.json`
- Create: `web/messages/en/hero.json`
- Create: `web/messages/en/pain.json`
- Create: `web/messages/en/solution.json`
- Create: `web/messages/en/features.json`
- Create: `web/messages/en/how-it-works.json`
- Create: `web/messages/en/providers.json`
- Create: `web/messages/en/pricing.json`
- Create: `web/messages/en/faq.json`
- Create: `web/messages/en/footer.json`
- Create: `web/messages/pt/*.json` (mesmos 10)

- [ ] **Step 1: Create `web/messages/pt/common.json`**

```json
{
  "nav": {
    "features": "Features",
    "how_it_works": "Como funciona",
    "pricing": "Preços",
    "faq": "FAQ",
    "github": "GitHub"
  },
  "language": {
    "label": "Idioma",
    "pt": "Português",
    "en": "English"
  },
  "theme": {
    "toggle": "Alternar tema"
  }
}
```

- [ ] **Step 2: Create `web/messages/en/common.json`**

```json
{
  "nav": {
    "features": "Features",
    "how_it_works": "How it works",
    "pricing": "Pricing",
    "faq": "FAQ",
    "github": "GitHub"
  },
  "language": {
    "label": "Language",
    "pt": "Português",
    "en": "English"
  },
  "theme": {
    "toggle": "Toggle theme"
  }
}
```

- [ ] **Step 3: Create `web/messages/pt/hero.json`**

```json
{
  "headline": "Você não programa. Você só pede.",
  "sub": "Cola código do ChatGPT. Roda. Funcionou. Não sabe por quê. Próximo bug você trava. DevSenses te tira disso.",
  "cta_primary": "Entrar na waitlist",
  "cta_secondary": "Ver no GitHub",
  "tagline_top": "IDE desktop com IA educacional"
}
```

- [ ] **Step 4: Create `web/messages/en/hero.json`**

```json
{
  "headline": "You don't code. You just ask.",
  "sub": "You paste ChatGPT code. It runs. It works. You have no idea why. Next bug, you're stuck. DevSenses fixes that.",
  "cta_primary": "Join the waitlist",
  "cta_secondary": "View on GitHub",
  "tagline_top": "Educational AI desktop IDE"
}
```

- [ ] **Step 5: Create `web/messages/pt/pain.json`**

```json
{
  "title": "3 anos de carreira. Ainda júnior.",
  "subtitle": "A IA te deu produtividade. E te tirou o aprendizado.",
  "bullets": [
    "Você usa Cursor mas não lê o diff.",
    "Você aceita sugestão sem entender.",
    "Você quebra em entrevista técnica básica.",
    "Você acha que é dev. É operador de prompt."
  ]
}
```

- [ ] **Step 6: Create `web/messages/en/pain.json`**

```json
{
  "title": "3 years in. Still junior.",
  "subtitle": "AI gave you speed. And took away the learning.",
  "bullets": [
    "You use Cursor but don't read the diff.",
    "You accept suggestions without understanding.",
    "You crash in basic tech interviews.",
    "You think you're a dev. You're a prompt operator."
  ]
}
```

- [ ] **Step 7: Create `web/messages/pt/solution.json`**

```json
{
  "title": "Toda alteração vira aula.",
  "sub": "DevSenses lê seu git diff. Explica o que mudou no SEU nível. Ensina o conceito por trás. Te força a entender.",
  "demo_label": "git diff explicado:",
  "demo_diff": "+ const [count, setCount] = useState(0)\n+ useEffect(() => {\n+   document.title = `Count: ${count}`\n+ }, [count])",
  "demo_explanation": [
    "useState cria estado local. count guarda valor, setCount atualiza.",
    "useEffect roda código após render. Aqui sincroniza title do documento.",
    "Array [count] é dependência: effect roda quando count muda.",
    "Sem dependência = roda todo render. Com [] = roda 1x. Detalhe importa."
  ]
}
```

- [ ] **Step 8: Create `web/messages/en/solution.json`**

```json
{
  "title": "Every change becomes a lesson.",
  "sub": "DevSenses reads your git diff. Explains what changed at YOUR level. Teaches the concept behind it. Forces you to understand.",
  "demo_label": "git diff explained:",
  "demo_diff": "+ const [count, setCount] = useState(0)\n+ useEffect(() => {\n+   document.title = `Count: ${count}`\n+ }, [count])",
  "demo_explanation": [
    "useState creates local state. count holds value, setCount updates it.",
    "useEffect runs code after render. Here it syncs document title.",
    "Array [count] is dependency: effect runs when count changes.",
    "No deps = every render. Empty [] = once. The detail matters."
  ]
}
```

- [ ] **Step 9: Create `web/messages/pt/features.json`**

```json
{
  "title": "Não é mais um copilot.",
  "subtitle": "É um senpai.",
  "items": [
    {
      "title": "Diff Reviewer",
      "description": "Cada commit explicado no seu nível"
    },
    {
      "title": "Quiz de Senioridade",
      "description": "8 perguntas. Descobre onde você trava de verdade"
    },
    {
      "title": "5 IAs, 1 lugar",
      "description": "Claude, Codex, Gemini, Aider, Ollama. Sua escolha"
    },
    {
      "title": "Modo Educacional",
      "description": "Não te dá resposta. Te dá perguntas"
    }
  ]
}
```

- [ ] **Step 10: Create `web/messages/en/features.json`**

```json
{
  "title": "Not another copilot.",
  "subtitle": "It's a senpai.",
  "items": [
    {
      "title": "Diff Reviewer",
      "description": "Every commit explained at your level"
    },
    {
      "title": "Seniority Quiz",
      "description": "8 questions. Finds where you're actually stuck"
    },
    {
      "title": "5 AIs, 1 place",
      "description": "Claude, Codex, Gemini, Aider, Ollama. Your call"
    },
    {
      "title": "Educational Mode",
      "description": "Doesn't give answers. Gives questions"
    }
  ]
}
```

- [ ] **Step 11: Create `web/messages/pt/how-it-works.json`**

```json
{
  "title": "Em 60 segundos.",
  "subtitle": "Sem onboarding chato.",
  "steps": [
    {
      "number": "01",
      "title": "Instala",
      "description": "mac, win, linux. Um clique."
    },
    {
      "number": "02",
      "title": "Conecta sua CLI IA",
      "description": "Já tem claude/codex/gemini? Detecta sozinho."
    },
    {
      "number": "03",
      "title": "Abre projeto",
      "description": "Toda alteração vira lição. Automatico."
    }
  ]
}
```

- [ ] **Step 12: Create `web/messages/en/how-it-works.json`**

```json
{
  "title": "In 60 seconds.",
  "subtitle": "No boring onboarding.",
  "steps": [
    {
      "number": "01",
      "title": "Install",
      "description": "mac, win, linux. One click."
    },
    {
      "number": "02",
      "title": "Connect your AI CLI",
      "description": "Got claude/codex/gemini? It detects them."
    },
    {
      "number": "03",
      "title": "Open project",
      "description": "Every change becomes a lesson. Automatic."
    }
  ]
}
```

- [ ] **Step 13: Create `web/messages/pt/providers.json`**

```json
{
  "title": "Use a IA que já paga.",
  "subtitle": "Zero lock-in. BYOK.",
  "providers": [
    { "name": "Claude", "vendor": "Anthropic" },
    { "name": "Codex", "vendor": "OpenAI" },
    { "name": "Gemini", "vendor": "Google" },
    { "name": "Aider", "vendor": "Open Source" },
    { "name": "Ollama", "vendor": "Local / Offline" }
  ]
}
```

- [ ] **Step 14: Create `web/messages/en/providers.json`**

```json
{
  "title": "Use the AI you already pay for.",
  "subtitle": "Zero lock-in. BYOK.",
  "providers": [
    { "name": "Claude", "vendor": "Anthropic" },
    { "name": "Codex", "vendor": "OpenAI" },
    { "name": "Gemini", "vendor": "Google" },
    { "name": "Aider", "vendor": "Open Source" },
    { "name": "Ollama", "vendor": "Local / Offline" }
  ]
}
```

- [ ] **Step 15: Create `web/messages/pt/pricing.json`**

```json
{
  "title": "Pague uma vez. Use pra sempre.",
  "subtitle": "Sem assinatura. Sem pegadinha.",
  "plans": [
    {
      "id": "free",
      "name": "Free Beta",
      "badge": "Agora",
      "price": "R$ 0",
      "period": "tempo limitado",
      "description": "Tudo liberado. Enquanto durar o beta.",
      "features": [
        "Diff Reviewer ilimitado",
        "Quiz de senioridade",
        "Suporte a 5 CLIs IA",
        "Updates durante beta"
      ],
      "cta": "Entrar na waitlist"
    },
    {
      "id": "early",
      "name": "Lifetime Early Bird",
      "badge": "Limitado",
      "price": "R$ 97",
      "period": "uma vez. pra sempre.",
      "description": "Primeiros 100 devs. Acesso vitalício.",
      "features": [
        "Tudo do Free",
        "Updates pra sempre",
        "Acesso a features Pro",
        "Suporte prioritário"
      ],
      "cta": "Reservar vaga",
      "limit": "{used} / 100 vagas restantes",
      "highlight": true
    },
    {
      "id": "standard",
      "name": "Lifetime",
      "price": "R$ 297",
      "period": "uma vez. pra sempre.",
      "description": "Quando os 100 acabarem.",
      "features": [
        "Tudo do Early Bird",
        "Sem limite de vagas"
      ],
      "cta": "Em breve"
    }
  ]
}
```

- [ ] **Step 16: Create `web/messages/en/pricing.json`**

```json
{
  "title": "Pay once. Use forever.",
  "subtitle": "No subscription. No catch.",
  "plans": [
    {
      "id": "free",
      "name": "Free Beta",
      "badge": "Now",
      "price": "$0",
      "period": "limited time",
      "description": "Everything unlocked. While beta lasts.",
      "features": [
        "Unlimited Diff Reviewer",
        "Seniority Quiz",
        "5 AI CLIs supported",
        "Updates during beta"
      ],
      "cta": "Join waitlist"
    },
    {
      "id": "early",
      "name": "Lifetime Early Bird",
      "badge": "Limited",
      "price": "$19",
      "period": "once. forever.",
      "description": "First 100 devs. Lifetime access.",
      "features": [
        "Everything in Free",
        "Updates forever",
        "Pro features access",
        "Priority support"
      ],
      "cta": "Reserve seat",
      "limit": "{used} / 100 seats left",
      "highlight": true
    },
    {
      "id": "standard",
      "name": "Lifetime",
      "price": "$59",
      "period": "once. forever.",
      "description": "After the 100 are gone.",
      "features": [
        "Everything in Early Bird",
        "No seat limit"
      ],
      "cta": "Coming soon"
    }
  ]
}
```

- [ ] **Step 17: Create `web/messages/pt/faq.json`**

```json
{
  "title": "Perguntas honestas.",
  "subtitle": "Respostas honestas.",
  "items": [
    {
      "q": "DevSenses substitui Cursor/Copilot?",
      "a": "Não. Roda do lado, te ensina o que eles fazem."
    },
    {
      "q": "Funciona offline?",
      "a": "Com Ollama, sim. 100% local."
    },
    {
      "q": "Vai virar opensource?",
      "a": "Talvez. Lifetime garante acesso eterno mesmo se virar."
    },
    {
      "q": "Preciso pagar IA também?",
      "a": "Sim, BYOK. Você usa sua key da Anthropic/OpenAI/etc. Custo separado."
    },
    {
      "q": "Por que 'educacional'?",
      "a": "Porque produtividade sem entendimento te trava em júnior pra sempre."
    },
    {
      "q": "Quanto tempo de beta?",
      "a": "Sem prazo fixo. Avisamos via waitlist quando virar pago."
    }
  ]
}
```

- [ ] **Step 18: Create `web/messages/en/faq.json`**

```json
{
  "title": "Honest questions.",
  "subtitle": "Honest answers.",
  "items": [
    {
      "q": "Does DevSenses replace Cursor/Copilot?",
      "a": "No. It runs alongside, teaches you what they do."
    },
    {
      "q": "Works offline?",
      "a": "With Ollama, yes. 100% local."
    },
    {
      "q": "Will it go open source?",
      "a": "Maybe. Lifetime guarantees forever access even if it does."
    },
    {
      "q": "Do I pay for AI too?",
      "a": "Yes, BYOK. You use your Anthropic/OpenAI/etc key. Separate cost."
    },
    {
      "q": "Why 'educational'?",
      "a": "Because productivity without understanding traps you at junior forever."
    },
    {
      "q": "How long is beta?",
      "a": "No fixed deadline. We notify via waitlist when it goes paid."
    }
  ]
}
```

- [ ] **Step 19: Create `web/messages/pt/footer.json`**

```json
{
  "tagline": "Vire dev. Não operador.",
  "copyright": "© 2026. Todos os direitos reservados. Desenvolvido por",
  "links": {
    "github": "GitHub",
    "twitter": "Twitter",
    "discord": "Discord",
    "email": "Contato"
  }
}
```

- [ ] **Step 20: Create `web/messages/en/footer.json`**

```json
{
  "tagline": "Become a dev. Not an operator.",
  "copyright": "© 2026. All rights reserved. Built by",
  "links": {
    "github": "GitHub",
    "twitter": "Twitter",
    "discord": "Discord",
    "email": "Contact"
  }
}
```

- [ ] **Step 21: Verify file count**

```bash
ls /Users/luccas/Documents/Github/DevSenses/web/messages/pt/ | wc -l
ls /Users/luccas/Documents/Github/DevSenses/web/messages/en/ | wc -l
```

Expected: `10` each.

- [ ] **Step 22: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/messages/
```

---

### Task 7: Configurar next-intl routing + middleware

**Files:**
- Create: `web/i18n/routing.ts`
- Create: `web/i18n/request.ts`
- Create: `web/middleware.ts`
- Modify: `web/next.config.ts`

- [ ] **Step 1: Create `web/i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed'
})
```

- [ ] **Step 2: Create `web/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

const NAMESPACES = [
  'common',
  'hero',
  'pain',
  'solution',
  'features',
  'how-it-works',
  'providers',
  'pricing',
  'faq',
  'footer'
] as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`)
      return [ns, mod.default] as const
    })
  )

  const messages = Object.fromEntries(entries)

  return { locale, messages }
})
```

- [ ] **Step 3: Create `web/middleware.ts`**

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
```

- [ ] **Step 4: Replace `web/next.config.ts` with next-intl plugin**

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 5: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/i18n/ web/middleware.ts web/next.config.ts
```

---

### Task 8: Mover app/ pra app/[locale]/

**Files:**
- Move: `web/app/page.tsx` → `web/app/[locale]/page.tsx`
- Modify: `web/app/layout.tsx` (root, sem locale)
- Create: `web/app/[locale]/layout.tsx`
- Create: `web/app/[locale]/not-found.tsx`

- [ ] **Step 1: Create dir + move page**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && mkdir -p app/\[locale\] && mv app/page.tsx app/\[locale\]/page.tsx
```

- [ ] **Step 2: Replace `web/app/layout.tsx` (root) with minimal HTML shell**

```tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DevSenses',
    template: '%s — DevSenses'
  },
  description: 'Vire dev. Não operador.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create `web/app/[locale]/layout.tsx`**

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/theme-provider'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'pt')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 4: Create `web/app/[locale]/not-found.tsx`**

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link href="/" className="text-primary hover:underline">
        Voltar pra home
      </Link>
    </main>
  )
}
```

- [ ] **Step 5: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/app/
```

---

### Task 9: Criar ThemeProvider

**Files:**
- Create: `web/components/theme-provider.tsx`

- [ ] **Step 1: Create `web/components/theme-provider.tsx`**

```tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/theme-provider.tsx
```

---

### Task 10: Adicionar magicui animated-theme-toggler

**Files:**
- Create: `web/components/magicui/animated-theme-toggler.tsx`

- [ ] **Step 1: Install via shadcn registry**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npx shadcn@latest add @magicui/animated-theme-toggler
```

If interactive prompts ask for path, accept default `components/magicui/`.

- [ ] **Step 2: Verify file exists**

```bash
ls /Users/luccas/Documents/Github/DevSenses/web/components/magicui/
```

Expected: `animated-theme-toggler.tsx`.

- [ ] **Step 3: Adapt component to use next-themes if needed**

Read generated file:
```bash
cat /Users/luccas/Documents/Github/DevSenses/web/components/magicui/animated-theme-toggler.tsx
```

If it manipulates `document.documentElement.classList` directly without next-themes integration, replace contents with this version that uses next-themes:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, SunDim } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

export function AnimatedThemeToggler({ className }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const changeTheme = async () => {
    if (!buttonRef.current) return

    const next = resolvedTheme === 'dark' ? 'light' : 'dark'

    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    }).ready

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const right = window.innerWidth - left
    const bottom = window.innerHeight - top
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom))

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`]
      },
      { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    )
  }

  if (!mounted) {
    return <button ref={buttonRef} className={cn('p-2', className)} aria-hidden />
  }

  return (
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={cn('p-2 rounded-md hover:bg-muted transition-colors', className)}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <SunDim size={18} /> : <Moon size={18} />}
    </button>
  )
}
```

- [ ] **Step 4: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/magicui/
```

---

## Fase 2: Layout global (Task 11-15)

### Task 11: Animation wrappers

**Files:**
- Create: `web/components/animations/fade-in.tsx`
- Create: `web/components/animations/stagger.tsx`
- Create: `web/components/animations/gradient-blob.tsx`

- [ ] **Step 1: Create `web/components/animations/fade-in.tsx`**

```tsx
'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  y?: number
  once?: boolean
}

export function FadeIn({
  children,
  delay = 0,
  y = 24,
  once = true,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create `web/components/animations/stagger.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function Stagger({ children, className, staggerDelay = 0.08 }: Props) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } }
      }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}
```

- [ ] **Step 3: Create `web/components/animations/gradient-blob.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

export function GradientBlob({ className }: Props) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl opacity-40',
        'bg-gradient-to-br from-[#6618ed] to-[#a855f7]',
        className
      )}
      animate={{
        x: [0, 40, -20, 0],
        y: [0, -30, 20, 0],
        scale: [1, 1.1, 0.95, 1]
      }}
      transition={{
        duration: 18,
        ease: 'easeInOut',
        repeat: Infinity
      }}
    />
  )
}
```

- [ ] **Step 4: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/animations/
```

---

### Task 12: Lenis smooth scroll provider

**Files:**
- Create: `web/components/lenis-provider.tsx`
- Modify: `web/app/[locale]/layout.tsx`

- [ ] **Step 1: Create `web/components/lenis-provider.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
```

- [ ] **Step 2: Add LenisProvider to locale layout**

Modify `web/app/[locale]/layout.tsx` — wrap children:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/theme-provider'
import { LenisProvider } from '@/components/lenis-provider'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'pt')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LenisProvider>{children}</LenisProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/lenis-provider.tsx web/app/[locale]/layout.tsx
```

---

### Task 13: Language switcher

**Files:**
- Create: `web/components/layout/language-switcher.tsx`

- [ ] **Step 1: Create `web/components/layout/language-switcher.tsx`**

```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/cn'

export function LanguageSwitcher() {
  const t = useTranslations('common.language')
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (locale: 'pt' | 'en') => {
    const stripped = pathname.replace(/^\/(pt|en)/, '') || '/'
    const target = locale === 'pt' ? stripped : `/en${stripped}`
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
    router.push(target)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('label')}
        className="p-2 rounded-md hover:bg-muted transition-colors"
      >
        <Languages size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo('pt')}
          className={cn(currentLocale === 'pt' && 'text-primary font-medium')}
        >
          {t('pt')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo('en')}
          className={cn(currentLocale === 'en' && 'text-primary font-medium')}
        >
          {t('en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/layout/
```

---

### Task 14: Header

**Files:**
- Create: `web/components/layout/header.tsx`

- [ ] **Step 1: Create `web/components/layout/header.tsx`**

```tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

export async function Header() {
  const t = await getTranslations('common.nav')

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-lg tracking-tight">
          <span className="text-primary">Dev</span>Senses
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            {t('features')}
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            {t('how_it_works')}
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            {t('pricing')}
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            {t('faq')}
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/layout/header.tsx
```

---

### Task 15: Waitlist form (client) + API route

**Files:**
- Create: `web/components/waitlist-form.tsx`
- Create: `web/app/api/waitlist/route.ts`
- Create: `web/lib/waitlist.ts`
- Create: `web/.env.local.example`

- [ ] **Step 1: Create `web/lib/waitlist.ts`**

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254
}

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: 'invalid_email' | 'duplicate' | 'provider_error' }

export async function addToWaitlist(email: string, locale: string): Promise<WaitlistResult> {
  if (!isValidEmail(email)) {
    return { ok: false, error: 'invalid_email' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    console.warn('[waitlist] RESEND_API_KEY or RESEND_AUDIENCE_ID missing — running in dev mode (no-op)')
    return { ok: true }
  }

  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, unsubscribed: false })
    })

    if (res.status === 409) return { ok: false, error: 'duplicate' }
    if (!res.ok) return { ok: false, error: 'provider_error' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'provider_error' }
  }
}
```

- [ ] **Step 2: Create `web/app/api/waitlist/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { addToWaitlist } from '@/lib/waitlist'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { email, locale } = (body ?? {}) as { email?: string; locale?: string }
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const result = await addToWaitlist(email.trim().toLowerCase(), locale ?? 'pt')

  if (!result.ok) {
    const status = result.error === 'duplicate' ? 409 : result.error === 'invalid_email' ? 400 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `web/components/waitlist-form.tsx`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check } from 'lucide-react'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

type Props = {
  ctaLabel: string
  size?: 'default' | 'lg'
}

export function WaitlistForm({ ctaLabel, size = 'lg' }: Props) {
  const locale = useLocale()
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  const errorLabel = (err: string): string => {
    if (locale === 'pt') {
      if (err === 'invalid_email') return 'Email inválido.'
      if (err === 'duplicate') return 'Já tá na lista.'
      return 'Tenta de novo.'
    }
    if (err === 'invalid_email') return 'Invalid email.'
    if (err === 'duplicate') return 'Already on the list.'
    return 'Try again.'
  }

  const successLabel = locale === 'pt' ? 'Te avisamos!' : "You're in!"

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ kind: 'loading' })

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale })
      })
      const data = await res.json()

      if (!res.ok) {
        setState({ kind: 'error', message: errorLabel(data.error ?? 'unknown') })
        return
      }
      setState({ kind: 'success' })
    } catch {
      setState({ kind: 'error', message: errorLabel('network') })
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="flex items-center gap-2 text-primary font-medium">
        <Check size={20} />
        {successLabel}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <Input
        type="email"
        required
        placeholder={locale === 'pt' ? 'seu@email.com' : 'your@email.com'}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state.kind === 'loading'}
        className="flex-1"
      />
      <Button type="submit" size={size} disabled={state.kind === 'loading'}>
        {state.kind === 'loading' ? <Loader2 className="animate-spin" size={18} /> : ctaLabel}
      </Button>
      {state.kind === 'error' && (
        <p className="absolute mt-12 text-sm text-red-500" role="alert">
          {state.message}
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Create `web/.env.local.example`**

```bash
# Resend (waitlist) — get from https://resend.com
RESEND_API_KEY=
RESEND_AUDIENCE_ID=

# Public
NEXT_PUBLIC_GITHUB_URL=https://github.com/Luccas-carvalho/DevSenses
```

- [ ] **Step 5: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/lib/waitlist.ts web/app/api/ web/components/waitlist-form.tsx web/.env.local.example
```

---

## Fase 3: Sections (Task 16-23)

### Task 16: Hero section

**Files:**
- Create: `web/components/sections/hero.tsx`

- [ ] **Step 1: Create `web/components/sections/hero.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/animations/fade-in'
import { GradientBlob } from '@/components/animations/gradient-blob'
import { WaitlistForm } from '@/components/waitlist-form'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-6 py-24">
      <GradientBlob className="w-[700px] h-[700px] top-[-200px] left-1/2 -translate-x-1/2" />
      <GradientBlob className="w-[500px] h-[500px] bottom-[-150px] right-[-100px] opacity-25" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeIn delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border bg-background/60 backdrop-blur-sm text-xs text-muted-foreground font-mono">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            {t('tagline_top')}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-balance">
            {t('headline')}
          </h1>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            {t('sub')}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <WaitlistForm ctaLabel={t('cta_primary')} />
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/Luccas-carvalho/DevSenses'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={16} />
              {t('cta_secondary')}
              <ArrowRight size={14} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/hero.tsx
```

---

### Task 17: Pain section

**Files:**
- Create: `web/components/sections/pain.tsx` (server)
- Create: `web/components/sections/pain-list.tsx` (client — wraps `motion.div`)

> **Pattern:** server component fetches translations + renders static markup; client component wraps animations. Used in all section tasks below.

- [ ] **Step 1: Create `web/components/sections/pain-list.tsx` (client)**

```tsx
'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Stagger, staggerItem } from '@/components/animations/stagger'

export function PainList({ items }: { items: string[] }) {
  return (
    <Stagger className="mt-12 grid gap-4">
      {items.map((b, i) => (
        <motion.div
          key={i}
          variants={staggerItem}
          className="group flex items-start gap-4 p-5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-colors"
        >
          <div className="shrink-0 mt-0.5 size-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <X size={16} strokeWidth={2.5} />
          </div>
          <p className="text-lg text-foreground">{b}</p>
        </motion.div>
      ))}
    </Stagger>
  )
}
```

- [ ] **Step 2: Create `web/components/sections/pain.tsx` (server)**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { PainList } from './pain-list'

export async function Pain() {
  const t = await getTranslations('pain')
  const bullets = t.raw('bullets') as string[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
            {t('subtitle')}
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            {t('title')}
          </h2>
        </FadeIn>
        <PainList items={bullets} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/pain.tsx web/components/sections/pain-list.tsx
```

---

### Task 18: Solution section + animated diff demo

**Files:**
- Create: `web/components/sections/solution.tsx`
- Create: `web/components/animated-diff-demo.tsx`

- [ ] **Step 1: Create `web/components/animated-diff-demo.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type Props = {
  diff: string
  explanation: string[]
  label: string
}

export function AnimatedDiffDemo({ diff, explanation, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [activeLine, setActiveLine] = useState(-1)

  useEffect(() => {
    if (!inView) return
    let current = 0
    const interval = setInterval(() => {
      setActiveLine(current)
      current += 1
      if (current >= explanation.length) clearInterval(interval)
    }, 1200)
    return () => clearInterval(interval)
  }, [inView, explanation.length])

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-4 rounded-xl border border-border bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-muted/50 p-6 font-mono text-sm">
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-500/60" />
            <span className="size-3 rounded-full bg-yellow-500/60" />
            <span className="size-3 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-auto">{label}</span>
        </div>
        <pre className="whitespace-pre-wrap leading-relaxed">
          {diff.split('\n').map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('+')
                  ? 'text-green-500'
                  : line.startsWith('-')
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }
            >
              {line}
            </div>
          ))}
        </pre>
      </div>

      <div className="p-6 flex flex-col gap-3">
        <AnimatePresence>
          {explanation.slice(0, activeLine + 1).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-foreground leading-relaxed"
            >
              <span className="text-primary font-mono mr-2">{`>`}</span>
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
        {activeLine < explanation.length - 1 && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="size-2 bg-primary rounded-full"
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `web/components/sections/solution.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { AnimatedDiffDemo } from '@/components/animated-diff-demo'

export async function Solution() {
  const t = await getTranslations('solution')
  const diff = t('demo_diff')
  const explanation = t.raw('demo_explanation') as string[]

  return (
    <section id="features" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              {t('sub')}
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <AnimatedDiffDemo diff={diff} explanation={explanation} label={t('demo_label')} />
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/solution.tsx web/components/animated-diff-demo.tsx
```

---

### Task 19: Features section

**Files:**
- Create: `web/components/sections/features.tsx`
- Create: `web/components/sections/features-grid.tsx`

- [ ] **Step 1: Create `web/components/sections/features-grid.tsx` (client)**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Stagger, staggerItem } from '@/components/animations/stagger'
import { GitCompare, Brain, Cpu, GraduationCap } from 'lucide-react'

const ICONS = [GitCompare, Brain, Cpu, GraduationCap]

type Item = { title: string; description: string }

export function FeaturesGrid({ items }: { items: Item[] }) {
  return (
    <Stagger className="grid sm:grid-cols-2 gap-4 mt-12">
      {items.map((item, i) => {
        const Icon = ICONS[i] ?? GitCompare
        return (
          <motion.div
            key={i}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="group relative p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-colors overflow-hidden"
          >
            <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        )
      })}
    </Stagger>
  )
}
```

- [ ] **Step 2: Create `web/components/sections/features.tsx` (server)**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { FeaturesGrid } from './features-grid'

type Item = { title: string; description: string }

export async function Features() {
  const t = await getTranslations('features')
  const items = t.raw('items') as Item[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>
        <FeaturesGrid items={items} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/features.tsx web/components/sections/features-grid.tsx
```

---

### Task 20: How it works section

**Files:**
- Create: `web/components/sections/how-it-works.tsx`

- [ ] **Step 1: Create `web/components/sections/how-it-works.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'

type Step = { number: string; title: string; description: string }

export async function HowItWorks() {
  const t = await getTranslations('how-it-works')
  const steps = t.raw('steps') as Step[]

  return (
    <section id="how-it-works" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-full border border-primary bg-background text-primary font-mono font-bold mb-6 relative z-10">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/how-it-works.tsx
```

---

### Task 21: Providers section

**Files:**
- Create: `web/components/sections/providers.tsx`

- [ ] **Step 1: Create `web/components/sections/providers.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'

type Provider = { name: string; vendor: string }

export async function Providers() {
  const t = await getTranslations('providers')
  const providers = t.raw('providers') as Provider[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {providers.map((p) => (
              <div
                key={p.name}
                className="group relative p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 transition-colors text-center"
              >
                <p className="font-mono font-bold text-lg">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.vendor}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/providers.tsx
```

---

### Task 22: Pricing section

**Files:**
- Create: `web/components/sections/pricing.tsx`
- Create: `web/components/sections/pricing-card.tsx`

- [ ] **Step 1: Create `web/components/sections/pricing-card.tsx` (client)**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export type PricingPlan = {
  id: string
  name: string
  badge?: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  limit?: string
  highlight?: boolean
}

type Props = {
  plan: PricingPlan
  used?: number
}

export function PricingCard({ plan, used = 0 }: Props) {
  const limitText = plan.limit?.replace('{used}', String(100 - used))

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative p-8 rounded-2xl border bg-muted/20 flex flex-col',
        plan.highlight
          ? 'border-primary shadow-[0_0_50px_-10px_rgba(102,24,237,0.4)]'
          : 'border-border'
      )}
    >
      {plan.badge && (
        <Badge
          variant={plan.highlight ? 'default' : 'secondary'}
          className={cn(
            'absolute -top-3 left-6',
            plan.highlight && 'bg-primary text-primary-foreground'
          )}
        >
          {plan.badge}
        </Badge>
      )}

      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

      <div className="mt-6">
        <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
        <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
      </div>

      <ul className="mt-8 space-y-3 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {limitText && (
        <p className="mt-6 text-xs font-mono text-primary">{limitText}</p>
      )}

      <Button
        className="mt-6 w-full"
        variant={plan.highlight ? 'default' : 'outline'}
        size="lg"
      >
        {plan.cta}
      </Button>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create `web/components/sections/pricing.tsx` (server)**

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { PricingCard, type PricingPlan } from './pricing-card'

export async function Pricing() {
  const t = await getTranslations('pricing')
  const plans = t.raw('plans') as PricingPlan[]

  // hardcoded — backend de venda real vem depois
  const used = 0

  return (
    <section id="pricing" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.1}>
              <PricingCard plan={plan} used={used} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/pricing.tsx web/components/sections/pricing-card.tsx
```

---

### Task 23: FAQ section

**Files:**
- Create: `web/components/sections/faq.tsx`

- [ ] **Step 1: Create `web/components/sections/faq.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { FadeIn } from '@/components/animations/fade-in'

type Item = { q: string; a: string }

export async function Faq() {
  const t = await getTranslations('faq')
  const items = t.raw('items') as Item[]

  return (
    <section id="faq" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/faq.tsx
```

---

### Task 24: Footer section

**Files:**
- Create: `web/components/sections/footer.tsx`

- [ ] **Step 1: Create `web/components/sections/footer.tsx`**

```tsx
import { getTranslations } from 'next-intl/server'
import { Github, Twitter, MessageCircle, Mail } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'

export async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="main-footer relative px-6 pt-32 pb-12 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="font-mono text-3xl md:text-5xl font-bold tracking-tight">
              {t('tagline')}
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://github.com/Luccas-carvalho/DevSenses"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('links.github')}
              className="hover:text-foreground transition-colors"
            >
              <Github size={18} />
            </a>
            <a
              href="#"
              aria-label={t('links.twitter')}
              className="hover:text-foreground transition-colors"
            >
              <Twitter size={18} />
            </a>
            <a
              href="#"
              aria-label={t('links.discord')}
              className="hover:text-foreground transition-colors"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="mailto:luccas@devsenses.dev"
              aria-label={t('links.email')}
              className="hover:text-foreground transition-colors"
            >
              <Mail size={18} />
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center md:text-right">
            {t('copyright')}{' '}
            <a
              href="https://www.linkedin.com/in/luccas-carvalhodesenvolvedor"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link text-primary hover:text-primary/80 font-medium"
            >
              Luccas Carvalho
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/components/sections/footer.tsx
```

---

### Task 25: Compose page.tsx (juntar tudo)

**Files:**
- Modify: `web/app/[locale]/page.tsx`

- [ ] **Step 1: Replace `web/app/[locale]/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Hero } from '@/components/sections/hero'
import { Pain } from '@/components/sections/pain'
import { Solution } from '@/components/sections/solution'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Providers } from '@/components/sections/providers'
import { Pricing } from '@/components/sections/pricing'
import { Faq } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Pain />
        <Solution />
        <Features />
        <HowItWorks />
        <Providers />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run dev server**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm run dev
```

Expected: visit http://localhost:3000 → all sections render in PT, http://localhost:3000/en → all sections in EN. Theme toggle works. Language switcher works. Stop server.

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/app/[locale]/page.tsx
```

---

## Fase 4: SEO + finalização (Task 26-29)

### Task 26: Metadata por locale

**Files:**
- Modify: `web/app/[locale]/layout.tsx`

- [ ] **Step 1: Add `generateMetadata` to `web/app/[locale]/layout.tsx`**

Replace the file with this expanded version:

```tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/theme-provider'
import { LenisProvider } from '@/components/lenis-provider'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  const title = locale === 'pt'
    ? 'DevSenses — Vire dev. Não operador.'
    : 'DevSenses — Become a dev. Not an operator.'
  const description = t('sub')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
      siteName: 'DevSenses'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: locale === 'pt' ? '/' : `/${locale}`,
      languages: {
        pt: '/',
        en: '/en'
      }
    }
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'pt')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LenisProvider>{children}</LenisProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/app/[locale]/layout.tsx
```

---

### Task 27: OG image dinâmica

**Files:**
- Create: `web/app/[locale]/opengraph-image.tsx`

- [ ] **Step 1: Create `web/app/[locale]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params
}: {
  params: { locale: string }
}) {
  const headline = params.locale === 'pt'
    ? 'Você não programa. Você só pede.'
    : "You don't code. You just ask."

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a3a 50%, #0a0a0a 100%)',
          color: '#fafafa',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '999px',
              background: '#6618ed'
            }}
          />
          <span
            style={{
              fontSize: '20px',
              color: '#a1a1aa',
              fontFamily: 'monospace'
            }}
          >
            DevSenses
          </span>
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: '900px',
            display: 'flex'
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: '24px',
            color: '#a1a1aa',
            display: 'flex'
          }}
        >
          {params.locale === 'pt' ? 'Vire dev. Não operador.' : 'Become a dev. Not an operator.'}
        </div>
      </div>
    ),
    { ...size }
  )
}
```

- [ ] **Step 2: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/app/[locale]/opengraph-image.tsx
```

---

### Task 28: robots.txt + sitemap

**Files:**
- Create: `web/app/robots.ts`
- Create: `web/app/sitemap.ts`

- [ ] **Step 1: Create `web/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://devsenses.dev/sitemap.xml'
  }
}
```

- [ ] **Step 2: Create `web/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://devsenses.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/en`, lastModified, changeFrequency: 'weekly', priority: 0.9 }
  ]
}
```

- [ ] **Step 3: Stage**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/app/robots.ts web/app/sitemap.ts
```

---

### Task 29: Build verification + lighthouse manual

**Files:**
- (no file changes — verification only)

- [ ] **Step 1: Run production build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm run build
```

Expected: build succeeds, no type errors. If errors occur, fix them inline before proceeding.

- [ ] **Step 2: Run production server**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web && npm start
```

Expected: server starts on port 3000. Visit:
- `http://localhost:3000/` → renders PT
- `http://localhost:3000/en` → renders EN
- Theme toggle works (animated transition)
- Language switcher works
- Smooth scroll active (Lenis)
- All sections render
- Waitlist form works (no real provider — logs warning, returns ok)
- FAQ accordion expands
- No console errors

- [ ] **Step 3: Lighthouse manual check**

Open Chrome DevTools → Lighthouse tab → Run for "Performance + Accessibility + SEO" desktop. Expected scores:
- Performance: ≥ 85
- Accessibility: ≥ 95
- SEO: 100

If below thresholds, identify failing audit and fix (common issues: missing alt text, heading hierarchy, contrast).

- [ ] **Step 4: Stop server, report status to user**

Stop server with Ctrl+C. Report: "Build green, all sections render in PT/EN, themes work, lighthouse passed. Ready for review."

- [ ] **Step 5: Stage all remaining changes**

```bash
cd /Users/luccas/Documents/Github/DevSenses && git add web/
```

---

## Self-Review checklist

| Spec section | Task(s) | Status |
|--------------|---------|--------|
| Monorepo via npm workspaces | 1 | ✓ |
| Next 15 scaffold | 2-3 | ✓ |
| Tailwind 4 + theme vars + Geist | 3 | ✓ |
| shadcn/ui setup | 4 | ✓ |
| Tema light/dark com primary `#6618ed` | 3, 9 | ✓ |
| magicui animated-theme-toggler | 10 | ✓ |
| next-intl namespaced (PT/EN) | 5-7 | ✓ |
| 10 namespaces × 2 locales | 6 | ✓ |
| `[locale]` segment + middleware | 7-8 | ✓ |
| Animations (fade, stagger, blob) | 11 | ✓ |
| Lenis smooth scroll | 12 | ✓ |
| Header + LanguageSwitcher | 13-14 | ✓ |
| Hero (provocative copy) | 16 | ✓ |
| Pain section | 17 | ✓ |
| Solution + animated diff demo | 18 | ✓ |
| Features | 19 | ✓ |
| How it works | 20 | ✓ |
| Providers | 21 | ✓ |
| Pricing (3 plans, early bird) | 22 | ✓ |
| FAQ | 23 | ✓ |
| Footer (LinkedIn link Luccas) | 24 | ✓ |
| Page composition | 25 | ✓ |
| Metadata + OG (i18n) | 26-27 | ✓ |
| robots.txt + sitemap | 28 | ✓ |
| Build verification | 29 | ✓ |
| Waitlist form + API | 15 | ✓ |
| Resend default provider | 15 | ✓ |

**Out of scope (per spec):** blog, docs, login, real payment, advanced analytics, 3D scenes via Three.js (mentioned as optional in spec, deferred).

**No placeholders remaining:** all code blocks complete, all paths exact, all test/verification commands explicit.

---

## Próximos passos pós-implementação

- User commit em batches por fase (Fase 0, 1, 2, 3, 4) ou single big commit (escolha do user)
- Deploy Vercel apontando pra `web/` subdir
- Configurar domínio (devsenses.dev sugerido)
- Configurar `RESEND_API_KEY` + `RESEND_AUDIENCE_ID` em Vercel env vars
- Criar OG image estática em `public/og-image.png` ou usar a dinâmica gerada
- (Opcional) Three.js / WebGL hero scene estilo igloo.inc — separate plan
