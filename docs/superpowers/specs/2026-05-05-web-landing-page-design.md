# DevSenses — Web Landing Page (Design Spec)

> **Goal:** Construir landing page única (one-page scroll) em `web/` dentro do monorepo DevSenses. Site high-tech moderno, minimalista, animado, com copy provocativa atacando dor do dev júnior IA-dependente. Captura waitlist + GitHub stars pré-launch.

> **Status:** Spec aprovada pelo usuário (2026-05-05). Próximo passo: implementation plan via `superpowers:writing-plans`.

---

## Contexto

DevSenses é IDE desktop Electron (Fase 0/1 atualmente) que lê git diffs, explica alterações no nível de senioridade do usuário e ensina conceitos. Roda CLIs IA já instaladas (claude, codex, gemini, aider, ollama).

Esta spec cobre **apenas o site de marketing** que vive em `web/` dentro do mesmo repo. App Electron e site são totalmente desacoplados em runtime — só compartilham `node_modules` deduplicado via npm workspaces.

## Audiência alvo

Dev júnior que:
- Cola código de ChatGPT/Cursor sem entender
- Trava em problemas básicos quando IA falha
- Acha que produtividade = senioridade
- Estagnou em júnior apesar do tempo de carreira

Tom da copy: **provocativo/agressivo**. Choca pra converter. Risco aceito: afasta quem não curte tom direto.

---

## Architecture

### Monorepo

- Root `DevSenses/package.json` ganha `"workspaces": ["web"]`
- App Electron continua na raiz, scripts originais intactos
- Site vive em `web/` com próprio `package.json`, deps isoladas
- `cd web && npm run dev` → Next dev server porta 3000
- `npm run dev` na raiz → app Electron (sem mudança)
- Zero acoplamento de runtime entre os dois

### Rendering strategy — Hybrid SSR/Client

- **Server Components (default):** seções de conteúdo (hero text, pain, features text, pricing, FAQ, footer) — SEO topo, HTML pré-renderizado, copy indexada Google
- **Client Components (`"use client"`):** apenas onde necessário — theme toggle, language switcher, demo animado, accordion FAQ, waitlist form, framer-motion wrappers
- Bundle JS mínimo, animações lazy-loaded

### Tech stack

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Framework | Next.js 15 (App Router) | SSR para SEO, RSC, file-based routing |
| Runtime | React 19 | Latest, alinhado com app |
| Linguagem | TypeScript 5.x | Type safety |
| Styling | Tailwind CSS 4 | CSS-first config, mesma do app |
| Components | shadcn/ui | Mesma do app, copy-paste primitives |
| Animações | framer-motion 12 | Mesma do app, scroll-driven, on-viewport-enter |
| 3D / WebGL | `@react-three/fiber` + `@react-three/drei` (opcional) | Para hero 3D scene estilo igloo.inc, lazy load |
| Smooth scroll | Lenis | Padrão sites high-end (igloo, awwwards) |
| i18n | next-intl | Nativo Next App Router, server+client |
| Theming | next-themes | SSR-safe dark/light |
| Theme toggle | magicui `animated-theme-toggler` | Animação massa requerida |
| Fonte | Geist (sans + mono) | Vibe Vercel/Linear |
| Deploy | Vercel | Free tier, edge, Next-native |

---

## Estrutura de arquivos

Localização: `/Users/luccas/Documents/Github/DevSenses/web/`

```
web/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                # ThemeProvider + NextIntlClientProvider + Header + Footer
│   │   ├── page.tsx                  # Home (compõe seções em ordem)
│   │   ├── opengraph-image.tsx       # OG image dinâmica (Vercel OG)
│   │   └── not-found.tsx
│   ├── api/
│   │   └── waitlist/route.ts         # POST email, valida, envia pra Resend/Loops/etc
│   ├── globals.css                   # Tailwind 4 directives + CSS vars light/dark
│   ├── favicon.ico
│   └── robots.txt
├── components/
│   ├── sections/                     # 1 arquivo = 1 seção landing
│   │   ├── hero.tsx
│   │   ├── pain.tsx
│   │   ├── solution.tsx              # demo animado diff→explicação
│   │   ├── features.tsx
│   │   ├── how-it-works.tsx
│   │   ├── providers.tsx
│   │   ├── pricing.tsx
│   │   ├── faq.tsx
│   │   └── footer.tsx
│   ├── ui/                           # shadcn primitives (button, card, input, accordion, etc)
│   ├── magicui/
│   │   └── animated-theme-toggler.tsx
│   ├── layout/
│   │   ├── header.tsx                # logo + nav + theme toggle + language switcher
│   │   └── language-switcher.tsx
│   ├── animations/                   # framer-motion wrappers reutilizáveis
│   │   ├── fade-in.tsx               # fade + slide on viewport enter
│   │   ├── stagger.tsx               # stagger children
│   │   └── gradient-blob.tsx         # blob roxo animado de fundo
│   ├── waitlist-form.tsx             # client component, submete API route
│   └── animated-diff-demo.tsx        # client, mostra terminal fake + explicação
├── messages/                         # i18n namespaced (estilo ezchat)
│   ├── en/
│   │   ├── common.json               # nav, header, language names
│   │   ├── hero.json
│   │   ├── pain.json
│   │   ├── solution.json
│   │   ├── features.json
│   │   ├── how-it-works.json
│   │   ├── providers.json
│   │   ├── pricing.json
│   │   ├── faq.json
│   │   └── footer.json
│   └── pt/
│       └── (mesmos 10 arquivos)
├── i18n/
│   ├── routing.ts                    # locales: ['en','pt'], defaultLocale: 'pt', localePrefix: 'as-needed'
│   └── request.ts                    # getRequestConfig — carrega namespaces dinamicamente
├── lib/
│   ├── cn.ts                         # clsx + tailwind-merge
│   └── waitlist.ts                   # validação email, integração provider
├── public/
│   ├── icon.svg
│   ├── og-image.png
│   └── demo/                         # SVGs/gifs ilustrativos
├── middleware.ts                     # next-intl middleware (locale detection)
├── components.json                   # shadcn config
├── next.config.ts                    # next-intl plugin
├── tailwind.config.ts                # primary #6618ed, fontes Geist
├── tsconfig.json
├── package.json                      # deps isoladas
└── .env.local                        # WAITLIST_API_KEY, etc
```

### Princípios de organização

- **1 seção = 1 arquivo** em `components/sections/`. Escopo isolado, fácil testar/refatorar
- **i18n namespaced** — nunca um único arquivo gigante. Cada seção tem seu JSON, igual ezchat
- **Animações reutilizáveis** em `components/animations/` — DRY
- **Server por default, client só onde precisa** — prefixar `"use client"` apenas em componentes interativos

---

## i18n (next-intl)

### Routing

- Locales: `['en', 'pt']`
- Default: `pt` (audiência primária Brasil)
- Estratégia: `localePrefix: 'as-needed'` — `/` = pt (sem prefixo), `/en` = inglês
- Detecção: middleware lê header `Accept-Language` + cookie persistido

```ts
// i18n/routing.ts
import {defineRouting} from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed'
})
```

### Carregamento de namespaces

```ts
// i18n/request.ts
import {getRequestConfig} from 'next-intl/server'
import {routing} from './routing'

const NAMESPACES = [
  'common','hero','pain','solution','features',
  'how-it-works','providers','pricing','faq','footer'
] as const

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  const messages = Object.fromEntries(
    await Promise.all(
      NAMESPACES.map(async (ns) => [
        ns,
        (await import(`../messages/${locale}/${ns}.json`)).default
      ])
    )
  )

  return { locale, messages }
})
```

### Uso

```tsx
// Server component
import {getTranslations} from 'next-intl/server'
const t = await getTranslations('hero')
<h1>{t('headline')}</h1>

// Client component
'use client'
import {useTranslations} from 'next-intl'
const t = useTranslations('hero')
```

### Language switcher

Dropdown no header. Troca rota via `useRouter` do next-intl. Persiste cookie `NEXT_LOCALE`.

---

## Theming

### Cores

- **Primary:** `#6618ed` (roxo elétrico, mesmo light + dark)
- **Foreground/Background:** invertem entre temas
- **Accent secundário:** gradient `from-[#6618ed] to-[#a855f7]` para blobs e glows

### CSS vars (Tailwind 4)

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-primary: #6618ed;
  --color-primary-foreground: #ffffff;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --font-sans: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;
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
```

### Provider

```tsx
// app/[locale]/layout.tsx
<html lang={locale} suppressHydrationWarning>
  <body>
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  </body>
</html>
```

### Theme toggle

magicui `animated-theme-toggler` (instalado via `npx shadcn@latest add @magicui/animated-theme-toggler`). Vive no header. Animação de troca circular (view-transitions API). Persiste em localStorage via next-themes.

---

## Copy por seção

Tom: provocativo. PT é principal. EN tradução mantém edge.

### Hero (`messages/{locale}/hero.json`)

**PT:**
- `headline`: "Você não programa. Você só pede."
- `sub`: "Cola código do ChatGPT. Roda. Funcionou. Não sabe por quê. Próximo bug você trava. DevSenses te tira disso."
- `cta_primary`: "Entrar na waitlist"
- `cta_secondary`: "Ver no GitHub"

**EN:**
- `headline`: "You don't code. You just ask."
- `sub`: "You paste ChatGPT code. It runs. It works. You have no idea why. Next bug, you're stuck. DevSenses fixes that."
- `cta_primary`: "Join the waitlist"
- `cta_secondary`: "View on GitHub"

### Pain

**PT:**
- `title`: "3 anos de carreira. Ainda júnior."
- `bullets`:
  - "Você usa Cursor mas não lê o diff."
  - "Você aceita sugestão sem entender."
  - "Você quebra em entrevista técnica básica."
  - "Você acha que é dev. É operador de prompt."

**EN:**
- `title`: "3 years in. Still junior."
- `bullets`:
  - "You use Cursor but don't read the diff."
  - "You accept suggestions without understanding."
  - "You crash in basic tech interviews."
  - "You think you're a dev. You're a prompt operator."

### Solution

**PT:**
- `title`: "Toda alteração vira aula."
- `sub`: "DevSenses lê seu git diff. Explica o que mudou no SEU nível. Ensina o conceito por trás. Te força a entender."
- Demo visual: terminal fake mostra `git diff` à esquerda → painel direito anima explicação aparecendo linha a linha

**EN:**
- `title`: "Every change becomes a lesson."
- `sub`: "DevSenses reads your git diff. Explains what changed at YOUR level. Teaches the concept behind it. Forces you to understand."

### Features (4 cards)

PT/EN:
1. **Diff Reviewer** / **Diff Reviewer** — "Cada commit explicado no seu nível" / "Every commit explained at your level"
2. **Quiz de Senioridade** / **Seniority Quiz** — "8 perguntas. Descobre onde você trava de verdade" / "8 questions. Finds where you're actually stuck"
3. **5 IAs, 1 lugar** / **5 AIs, 1 place** — "Claude, Codex, Gemini, Aider, Ollama. Sua escolha" / "Claude, Codex, Gemini, Aider, Ollama. Your call"
4. **Modo Educacional** / **Educational Mode** — "Não te dá resposta. Te dá perguntas" / "Doesn't give answers. Gives questions"

### How it works (3 steps)

PT:
1. "Instala (mac/win/linux)"
2. "Conecta sua CLI IA (já instalada)"
3. "Abre projeto → toda alteração vira lição"

EN:
1. "Install (mac/win/linux)"
2. "Connect your AI CLI (already installed)"
3. "Open project → every change becomes a lesson"

### Providers

Grid logos: Claude (Anthropic), OpenAI Codex, Gemini, Aider, Ollama.
Caption PT: "Use a que já paga." / EN: "Use the one you already pay for."

### Pricing (3 cards)

**PT:**
1. **Free Beta** — "Tudo liberado. Tempo limitado." (atual, badge "Agora")
2. **Lifetime Early Bird** (destaque, badge "Limitado") — "R$ 97. Primeiros 100 devs. Pra sempre." + contador "X / 100 vagas"
3. **Lifetime Standard** — "R$ 297. Quando os 100 acabarem."

**EN:**
1. **Free Beta** — "Everything unlocked. Limited time." (badge "Now")
2. **Lifetime Early Bird** — "$19. First 100 devs. Forever." + counter "X / 100 slots"
3. **Lifetime Standard** — "$59. After the 100."

> Valores são placeholders — fácil trocar via i18n JSON. Counter inicial hardcoded `100/100` (sem backend de venda ainda).

### FAQ (5 perguntas)

PT:
- "DevSenses substitui Cursor/Copilot?" → "Não. Roda do lado, te ensina o que eles fazem."
- "Funciona offline?" → "Com Ollama, sim."
- "Vai virar opensource?" → "Talvez. Lifetime garante acesso eterno mesmo se virar."
- "Preciso pagar IA também?" → "Sim, BYOK. Você usa a sua key."
- "Por que 'educacional'?" → "Porque produtividade sem entendimento te trava em júnior."

EN: tradução literal.

### Footer

```tsx
<footer className="main-footer text-xs text-muted-foreground">
  <p>
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
</footer>
```

PT `copyright`: "© 2026. Todos os direitos reservados. Desenvolvido por"
EN `copyright`: "© 2026. All rights reserved. Built by"

Tagline acima do footer:
- PT: "Vire dev. Não operador."
- EN: "Become a dev. Not an operator."

Links sociais (header ou footer): GitHub, Twitter/X, Discord, Email.

---

## Animações

### Princípios

- **Sutis, não chamativas** — animação serve copy, não distrai
- **On-viewport-enter** — usa `whileInView` do framer pra disparar quando rola
- **Reduced motion respect** — `prefers-reduced-motion` desativa tudo via CSS + framer
- **GPU-only** — só `transform` e `opacity`, zero layout thrash

### Wrappers reutilizáveis

```tsx
// components/animations/fade-in.tsx
'use client'
export function FadeIn({children, delay = 0, ...rest}) {
  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-100px'}}
      transition={{duration: 0.6, delay, ease: 'easeOut'}}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
```

Idem `Stagger` (children com delay incremental) e `GradientBlob` (blob roxo se movendo lentamente atrás do hero).

### Animações por seção

- **Hero:** headline com `text-reveal` letra por letra, blob gradient roxo flutuando atrás, CTA com glow pulsante
- **Pain:** bullets aparecem em stagger conforme rola
- **Solution:** demo animado typing diff → explicação aparecendo linha a linha (tipo Terminal real)
- **Features:** cards com `hover:scale-[1.02]` + glow border
- **How it works:** linha conectando os 3 steps anima draw on viewport
- **Pricing:** card destaque tem `border-glow` animado contínuo
- **Tudo mais:** `FadeIn` simples

### Fontes de inspiração

- **`/Users/luccas/Documents/Github/lib-react-anchorlist/react-anchorlist-web`** — referência visual base. Tipografia limpa Geist, gradient sutil, espaçamento generoso, layout limpo
- **https://igloo.inc/** — referência de animações avançadas. Estudar:
  - 3D scenes com WebGL/Three.js (considerar `@react-three/fiber` se viável; senão simular com CSS 3D transforms)
  - Scroll-driven animations (usar `useScroll` + `useTransform` do framer-motion)
  - Parallax layers no hero
  - Smooth scroll global (lenis ou CSS `scroll-behavior: smooth`)
  - Micro-interactions em hover (cursor custom, magnetic buttons)
  - Transições entre seções com mask reveals
  - Bem high-tech, "vivo", animações ambientes constantes (não só on-enter)
- **Adaptação:** igloo é portfolio de agência (showcase pesado). DevSenses é landing de produto — pegar **vibe e densidade de animação**, não copiar elementos. Performance > demonstração técnica

---

## Data flow — Waitlist

### Fluxo

1. User digita email no `<WaitlistForm>` (client component)
2. Form valida formato (regex client-side rápido)
3. POST `/api/waitlist` com `{email, locale}`
4. Server route valida novamente, sanitiza, envia pra provider externo. **Default: Resend** (free tier 3k/mês, API simples, dev-friendly). Trocável via `lib/waitlist.ts`.
5. Resposta: `{ok: true}` ou `{error: 'reason'}`
6. UI mostra estado: idle → loading → success ("Te avisamos!") ou error ("Email inválido / já cadastrado")

### API route

```ts
// app/api/waitlist/route.ts
export async function POST(req: Request) {
  const {email, locale} = await req.json()

  if (!isValidEmail(email)) {
    return Response.json({error: 'invalid_email'}, {status: 400})
  }

  // rate limit por IP (futuro)
  // envia pro provider (Resend/Loops)
  // ...

  return Response.json({ok: true})
}
```

### Erros tratados

- Email inválido → 400 + mensagem i18n
- Email duplicado → 409 + "Já tá na lista"
- Provider fora → 500 + "Tenta de novo"
- Rate limit (futuro) → 429 + "Calma aí"

---

## Build & Deploy

### Local dev

```bash
cd web
npm install
npm run dev    # http://localhost:3000
```

App Electron continua rodando independente via `npm run dev` na raiz.

### Build

```bash
cd web
npm run build  # next build
npm start      # next start
```

### Deploy

- **Vercel** apontando pro subdir `web/`
- Branch `main` → produção, PRs → preview deploys
- Env vars: `WAITLIST_API_KEY` (Resend/Loops), `NEXT_PUBLIC_GITHUB_URL`

### Domain

A definir pelo usuário. Sugestão: `devsenses.com` ou `devsenses.dev`.

---

## SEO & Metadata

- `<title>` PT: "DevSenses — Vire dev. Não operador."
- `<title>` EN: "DevSenses — Become a dev. Not an operator."
- Meta description em ambos locales
- OG image dinâmica via `app/[locale]/opengraph-image.tsx` (Vercel OG, gradient roxo + headline)
- Twitter card large
- `robots.txt` permissivo
- Sitemap automático Next 15
- `hreflang` tags para alternates pt/en

---

## Testing

Escopo deliberadamente leve — landing estática, baixo risco regressão:

- **TypeScript strict** — pega 80% dos bugs
- **Build sucesso** = primeira validação (Next falha em type errors)
- **Lighthouse manual** pré-deploy: Performance > 90, Accessibility > 95, SEO 100
- **Sem testes unitários** pra começar — over-engineering pra landing
- **Visual regression manual** durante dev

Se site evoluir (forms complexos, A/B testing), adicionar Playwright depois.

---

## Out of scope (Fase 1 do site)

- Blog
- Docs (vivem em outro lugar quando app maduro)
- Changelog
- Páginas de pricing detalhadas
- Login / dashboard
- Pagamento real (lifetime placeholder por enquanto)
- Analytics avançado (só Vercel Analytics free no início)
- Internacionalização além de pt/en
- Tema "system" custom (next-themes faz isso nativo)

---

## Risks & Mitigations

| Risco | Mitigação |
|-------|-----------|
| Tom provocativo afasta usuários | Aceito — tom decidido pelo usuário, alinhado com posicionamento |
| Bundle JS inflado pelo framer-motion | Code-split, lazy load por seção, animações off em mobile baixo |
| i18n complexity em SSR | next-intl resolve, padrão Next 15 |
| Magicui theme toggler quebrar SSR | next-themes + suppressHydrationWarning resolve |
| Waitlist provider lock-in | Abstrair atrás de `lib/waitlist.ts`, fácil trocar |
| Pricing placeholder vira fake commitment | Card "Lifetime" sem botão de compra real, só waitlist |

---

## Checklist de aprovação

- [x] Estrutura de pastas
- [x] Stack (Next 15 + Tailwind 4 + shadcn + framer + next-intl + magicui)
- [x] Monorepo via npm workspaces
- [x] Tema light/dark com primary `#6618ed`
- [x] i18n namespaced PT/EN
- [x] Copy provocativa por seção
- [x] Pricing early bird placeholder
- [x] CTA = waitlist + GitHub
- [x] Footer com link LinkedIn do Luccas
- [ ] **Spec aprovada pelo usuário** ← próximo passo

---

## Próximo passo

Após aprovação, invocar `superpowers:writing-plans` para gerar plano de implementação detalhado (tasks atômicas, ordem, critérios de aceite).
