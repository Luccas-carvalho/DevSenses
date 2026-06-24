# DevSenses Site Redesign — Design Spec

**Date:** 2026-05-18
**Status:** Approved for implementation
**Scope:** Landing page (`web/`) full redesign

---

## 1. Context and Goals

DevSenses is an Electron desktop app (AI tutor for code). The marketing site lives in `web/` (Next.js 15, App Router, next-intl, Tailwind, framer-motion). The product is now **open source (MIT)** and no longer pre-launch.

**Primary goal:** convert visitors into GitHub stars and desktop-app downloads.

**Non-goals:** docs site, blog, Discord, contributor onboarding portal, paid pricing tier.

**Reference vibe:** `cadence-landing-19.aura.build` — dark dev-tool, refined tones, falling comets, smoke distortion on hover, mono labels.

---

## 2. Stack Constraints

- Next.js 15 App Router, `app/[locale]/page.tsx` is the landing
- next-intl with `pt` + `en` locales — **both maintained**
- Tailwind v4 + tokens via CSS variables (`globals.css`)
- framer-motion for animation primitives
- Lenis smooth-scroll already wired
- Package manager: **npm** (`package-lock.json`)

---

## 3. Approach

**Big-bang refactor in one PR.** All sections rewritten on a single branch and merged together. Decided over incremental because:
- Site is small (10-section landing, single repo)
- Solo maintainer; coordinating intermediate "half-new, half-old" deploys is overhead
- Design tokens, motion primitives and copy refresh are entangled — splitting them creates inconsistent intermediate states

Risk mitigation: deploy preview branch; manual QA against the checklist in §10 before merging.

---

## 4. Visual System

### 4.1 Palette (CSS variables in `web/app/globals.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `hsl(240 8% 4%)` | Page base |
| `--card` | `hsl(240 6% 7%)` | Cards, glass panels |
| `--border` | `hsl(240 5% 14%)` | Borders, dividers |
| `--foreground` | `hsl(240 5% 96%)` | Body text |
| `--muted-foreground` | `hsl(240 4% 60%)` | Secondary text |
| `--primary` | `hsl(258 90% 66%)` | Brand violet — refined sat |
| `--primary-foreground` | `hsl(0 0% 100%)` | Text on primary |
| `--accent-cyan` | `hsl(190 90% 60%)` | Status pulses only (live, star) |

Adjustments vs current: `--background` slightly darker, `--card` lift more visible, `--primary` sat tuned to match Cadence reference. Keep HSL format (matches existing pattern in `globals.css`).

### 4.2 Typography

Keep Geist Sans + Geist Mono. Rules:

- **Headlines (h1, h2):** `tracking-[-0.05em]` (was `-0.045em`). `text-balance` enforced.
- **Mono eyebrow labels:** uppercase, `letter-spacing: 0.15em` (was `0.1em`), prefixed with section number (`01·HERO`, `02·SOLUTION`, etc).
- **Body copy:** unchanged (16px / `leading-relaxed`).
- **Mono inline (CLI commands, code refs):** weight 500, size 13px, color `--primary` background `hsl(258 90% 66% / 0.08)`.

### 4.3 Motion Primitives

New components in `web/components/animations/`:

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `<CanvasField />` | Falling comets + smoke trails | Canvas 2D, requestAnimationFrame, 8–12 particles, `prefers-reduced-motion` respected, IntersectionObserver pauses offscreen |
| `<DemoPlayer />` | Plug-and-play mini-demo container for pillars | Pure CSS keyframes + framer-motion, no MP4/Lottie; takes a render prop or named demo id |
| `<NumberCounter />` | Animated count-up for GitHub stats | framer-motion `useSpring` + `useTransform`, accepts target value + duration |

Keep existing: `FadeIn`, `Stagger`, `MouseSpotlight`, `GalaxyBackdrop` (with the change in §5.1).

### 4.4 Performance budget

- Hero canvas: max 12 particles, draw skipped when tab hidden or section not in viewport
- Total JS over baseline: ≤ 60 KB gzipped (no WebGL, no MP4)
- Lighthouse mobile perf target: ≥ 85

---

## 5. Page Structure

`app/[locale]/page.tsx` order (column # is render order, not eyebrow numbering — Header/Marquee/Footer have no eyebrow):

| # | Section | Eyebrow | Status |
|---|---------|---------|--------|
| 1 | Header | — | Keep |
| 2 | Hero | `01·OPEN SOURCE` | Rewrite |
| 3 | Marquee | — | Keep |
| 4 | Solution | `02·SOLUTION` | **Merge** (absorbs Pain) |
| 5 | Showcase | `03·SHOWCASE` | Polish only |
| 6 | Features | `04·FEATURES` | Rework (DemoPlayer in pillars) |
| 7 | HowItWorks | `05·HOW IT WORKS` | Polish only |
| 8 | Providers | `06·PROVIDERS` | Polish only |
| 9 | **Install** | `07·INSTALL` | **New** |
| 10 | **Stats** | `08·STATS` | **New** |
| 11 | FAQ | `09·FAQ` | Copy refresh |
| 12 | Footer | — | Polish only |

### 5.1 Hero (`web/components/sections/hero.tsx`)

**Layout (top to bottom, centered):**
1. Pill: `01·OPEN SOURCE · MIT` with pulsing cyan dot
2. Headline: **"Entenda o código que sua IA escreveu."** (PT) / **"Understand the code your AI wrote."** (EN)
3. Sub: "DevSenses lê seu diff, explica linha por linha no seu nível, e prova com quiz que você entendeu."
4. CTA row:
   - Primary: `⭐ Star no GitHub` → `https://github.com/Luccas-carvalho/devsenses`
   - Secondary: `Ver features` → `#features`
5. Metrics row (mono, separator `·`):
   - Live GitHub stars (NumberCounter from API, cached localStorage 1h, fallback static `100+`)
   - `MIT License` pill
   - `v{latest} latest` pill (GitHub releases API, same cache strategy)

**Background layers (bottom to top z-index):**
1. `bg-grid` masked radial (keep)
2. `<GalaxyBackdrop />` — **modified:** orbits only, no stars (avoids overlap with comets)
3. `<CanvasField />` — 8–12 comets falling diagonal, trail fade
4. `<MouseSpotlight />` — **modified:** smoke distortion (radial gradient, blur 200px, follows cursor with lerp, breathes ±5% opacity over 2s)
5. Bottom vignette (`from-background to-transparent`) to fade into Marquee

**Removed:** `<AppShowcase />` — moves out of Hero (mockup duplicated Showcase).

### 5.2 Solution (`web/components/sections/solution.tsx`) — merges Pain

Top: Pain headline as eyebrow + 4 pain bullets in a 2x2 muted grid (small).
Bottom: existing Solution content (title, sub, demo block).

Visual: Pain bullets desaturated; Solution title pops with primary-foreground gradient. Single section flow:
> "Você commita. Mas entende?" (pain, small) → 4 bullets → "Toda alteração vira aula." (solution, large)

### 5.3 Features (`web/components/sections/feature-pillar.tsx`)

Adopt **Layout B** decided in brainstorming:
- Side header column now contains: eyebrow + title + description + **`<DemoPlayer />`** below
- Items column stays at `sm:grid-cols-2`
- Sticky header drops `DemoPlayer` (sticky only on eyebrow/title; demo scrolls naturally) — to revisit during impl if too busy

Three `DemoPlayer` instances (one per pillar):
- `adaptive`: slider showing 5 depth levels switching, sub-text morphing
- `power`: code block with ⌘K overlay highlighting a selection + tooltip popping
- `foundation`: 5 provider logos lighting in sequence behind a "100% local" badge

All demos pure CSS animation (no assets). Pause on `prefers-reduced-motion`.

### 5.4 Install (`web/components/sections/install.tsx` — new)

Eyebrow: `07·INSTALL`
Title: "Instala em 30 segundos."
Sub: "macOS, Linux, Windows. Sem cadastro."

Three tabs (simple useState, no radix dep needed):
- **macOS:** code block with copy command. **Implementation note:** no brew tap exists yet. Use `Download .dmg from latest release` as primary action and ship the brew command as a commented placeholder. Maintainer must replace the placeholder before merge or remove the tab.
- **Linux:** `Download .AppImage from latest release` link. Same caveat about install script — if no script exists at impl time, drop the curl command.
- **Windows:** link `Download .exe` → latest release asset.

Each tab body: download button OR code block with copy button (lucide `Copy` icon, swaps to `Check` for 2s on copy).

Asset URLs read from GitHub releases API at build time (or client-side with same cache strategy as Stats).

Below tabs: link "Ou build from source →" → README in repo root.

### 5.5 Stats (`web/components/sections/stats.tsx` — new)

Eyebrow: `08·OPEN SOURCE STATS`
Title: "Real, verificável, em código."

Four cards in `sm:grid-cols-2 lg:grid-cols-4`. **No emoji.** Each card uses a lucide icon:

| Card | Icon (lucide) | Source field |
|------|---------------|--------------|
| Stars | `Star` | `stargazers_count` |
| Forks | `GitFork` | `forks_count` |
| Contributors | `Users` | derived (separate API call to `/contributors`, length) |
| Releases | `Tag` | derived (separate API call to `/releases`, length) |

Each card: lucide icon, `<NumberCounter />`, label, micro-link "Ver no GitHub" with arrow.

Data fetched client-side from `https://api.github.com/repos/Luccas-carvalho/devsenses`. Cache key `devsenses:gh-stats`, TTL 1h. On error: static fallback values.

### 5.6 FAQ refresh

Update `messages/{pt,en}/faq.json`:
- Remove "Em breve · entra na waitlist" question
- Update "É open source mesmo?" — `Sim. MIT. Forka, contribui, audita. Disponível agora.`
- Add: `Como contribuir?` → link to CONTRIBUTING.md + good-first-issue search
- Add: `Roadmap?` → link to GitHub Projects board

### 5.7 Sections deleted

- `web/components/sections/pain.tsx`
- `web/components/sections/pain-list.tsx`
- `web/components/sections/pricing.tsx`
- `web/components/sections/pricing-card.tsx`
- `web/components/waitlist-form.tsx`
- `web/messages/pt/pain.json`
- `web/messages/en/pain.json`
- `web/messages/pt/pricing.json`
- `web/messages/en/pricing.json`

Update imports in `app/[locale]/page.tsx`.

---

## 6. Copy Refresh Rules

Tone: **informal br with concrete clarity** (keep "tu/tua/pra/forka", drop abstract).

Rules applied across all `messages/pt/*.json` and `messages/en/*.json`:

1. No mention of "em breve", "waitlist", "lançamento", "beta gratuita"
2. Sentences > 20 words split
3. Hero headline + sub rewritten (see §5.1)
4. FAQ updates (see §5.6)
5. EN translations parity with PT (keep English natural, not literal)

Specific copy changes locked in this spec; non-locked copy left to implementation judgment following the rules.

---

## 7. Component Inventory

### New files
- `web/components/animations/canvas-field.tsx`
- `web/components/animations/demo-player.tsx`
- `web/components/animations/number-counter.tsx`
- `web/components/sections/install.tsx`
- `web/components/sections/stats.tsx`
- `web/components/demos/adaptive-demo.tsx`
- `web/components/demos/power-demo.tsx`
- `web/components/demos/foundation-demo.tsx`
- `web/lib/github-stats.ts` (fetch + cache)
- `web/messages/pt/install.json`
- `web/messages/en/install.json`
- `web/messages/pt/stats.json`
- `web/messages/en/stats.json`

### Modified files
- `web/app/globals.css` — token values
- `web/app/[locale]/page.tsx` — section order
- `web/components/sections/hero.tsx` — rewrite
- `web/components/sections/solution.tsx` — absorb Pain
- `web/components/sections/feature-pillar.tsx` — Layout B
- `web/components/animations/galaxy-backdrop.tsx` — orbits-only mode
- `web/components/animations/mouse-spotlight.tsx` — smoke distortion variant
- `web/messages/pt/*.json` — copy refresh
- `web/messages/en/*.json` — copy refresh

### Deleted files
See §5.7.

---

## 8. Data Flow (GitHub stats)

```
Stats component / Hero metrics row
        │
        ▼
useGitHubStats() hook ─── reads localStorage cache (TTL 1h)
        │                       │
        │                       └── hit → return cached
        │
        └── miss → fetch /repos/Luccas-carvalho/devsenses
                    │
                    ├── ok → write cache, return
                    └── err → return static fallback ({ stars: 100, forks: 10, ... })
```

Hook lives in `web/lib/github-stats.ts`. No server-side fetch (avoids edge runtime + API rate limit per IP rather than per server). Anonymous GitHub API has 60 req/h per IP — cache makes this generous.

---

## 9. Accessibility

- All animations gated on `prefers-reduced-motion: reduce` (already wired in `FadeIn`/`Stagger`; new `CanvasField` and `DemoPlayer` must follow)
- Canvas decorative — `aria-hidden="true"`
- Copy buttons: visible focus ring, `aria-label="Copy command"`
- Color contrast: `--muted-foreground` against `--background` ≥ 4.5:1 (verify with token change)
- Tab order: pill → headline (skipped, not focusable) → CTAs → metrics links

---

## 10. Verification Checklist

Run before merging the redesign PR:

- [ ] `npm run build` succeeds in `web/`
- [ ] `npm run lint` clean
- [ ] No remaining imports of deleted components
- [ ] No remaining references to "waitlist" in code or messages
- [ ] Lighthouse mobile perf ≥ 85 (slow 4G throttle, M-sized phone)
- [ ] PT locale renders all sections without missing keys
- [ ] EN locale renders all sections without missing keys
- [ ] Canvas animations pause when scrolled offscreen
- [ ] Reduced-motion: zero animation when toggled
- [ ] GitHub stats fall back gracefully when offline
- [ ] Copy buttons in Install actually copy (manual test)
- [ ] Hero loads under 2.5s LCP on mid-tier mobile
- [ ] No console errors in Chrome dev tools
- [ ] Safari iOS smoke-test (mouse spotlight degrades gracefully on touch)

---

## 11. Out of Scope

Explicitly **not** in this redesign:
- Docs site or `/docs` route
- Blog or changelog page
- Contributor onboarding flow
- Discord integration
- Paid pricing tier
- Server-side GitHub stats (edge function)
- WebGL fluid simulation (decided in brainstorming — hybrid CSS+canvas only)
- Mobile-specific layouts beyond responsive breakpoints already in use
