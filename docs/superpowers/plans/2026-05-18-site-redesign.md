# DevSenses Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the DevSenses marketing landing (`web/`) into an open-source-positioned dev-tool site with refined dark theme, hybrid canvas animations, live GitHub stats, install section, and consolidated copy.

**Architecture:** Single big-bang refactor on one branch. Tokens-first → new motion primitives → section rewrites → cuts → QA → single PR. No new test framework added (project has none — verification is `next build` + manual smoke).

**Tech Stack:** Next.js 15 App Router (Turbopack), React 19, next-intl, Tailwind v4, framer-motion, Lenis, lucide-react. Package manager: **npm**.

**Spec:** `docs/superpowers/specs/2026-05-18-site-redesign-design.md`

**Working directory for all tasks:** `/Users/luccas/Documents/Github/DevSenses/web` unless noted.

**No test framework:** This project does not use vitest/jest in `web/`. Per user preference (no unrequested tooling), do not add one. Verification primitives:
- `npm run build` (runs `next build --turbopack` — does TypeScript check + bundles)
- `npm run dev` then manual browser smoke at `http://localhost:3000`
- TypeScript strict check via build output

**Commit convention:** Conventional Commits. Scope `web`. Example: `feat(web): add CanvasField primitive`. **DO NOT push to remote until the final task explicitly says so.** Commits land on a dedicated branch.

---

## Task 0: Create branch and verify baseline

**Files:** none

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git checkout -b redesign/site-2026-05
git status
```

Expected: clean tree on new branch.

- [ ] **Step 2: Baseline build to confirm starting state**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm install
npm run build
```

Expected: build succeeds with no TypeScript errors. If it fails on `main`, fix or abort before continuing.

- [ ] **Step 3: Baseline screenshot**

Manually open the existing site to remember "before" state:

```bash
npm run dev
```

Open `http://localhost:3000` in browser. Note current state of Hero, Features pillar 2 (the empty-space issue), and Footer. Stop the dev server (Ctrl+C). No commit.

---

## Task 1: Update design tokens (colors, radius, fonts)

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1: Replace dark-mode token block**

Open `web/app/globals.css`. Replace the entire `.dark { ... }` block (around lines 26-44) with:

```css
  .dark {
    --background: 240 8% 4%;
    --foreground: 240 5% 96%;
    --card: 240 6% 7%;
    --card-foreground: 240 5% 96%;
    --popover: 240 6% 7%;
    --popover-foreground: 240 5% 96%;
    --primary: 258 90% 66%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 5% 12%;
    --secondary-foreground: 240 5% 96%;
    --muted: 240 5% 12%;
    --muted-foreground: 240 4% 60%;
    --accent: 240 5% 14%;
    --accent-foreground: 240 5% 96%;
    --destructive: 0 70% 60%;
    --destructive-foreground: 0 0% 99%;
    --border: 240 5% 14%;
    --input: 240 5% 14%;
    --ring: 258 90% 66%;
    --accent-cyan: 190 90% 60%;
  }
```

- [ ] **Step 2: Run build to verify CSS still parses**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Visual smoke check**

```bash
npm run dev
```

Open `http://localhost:3000`. Background should be noticeably darker, primary violet slightly more saturated. Cards have a subtle lift vs background. Stop dev server.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/app/globals.css
git commit -m "refactor(web): refine dark theme tokens for open-source positioning"
```

---

## Task 2: Build NumberCounter primitive

**Files:**
- Create: `web/components/animations/number-counter.tsx`

- [ ] **Step 1: Write the component**

Create file `web/components/animations/number-counter.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion'

type Props = {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}

export function NumberCounter({ value, duration = 1.4, className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (latest) => Math.round(latest))
  const display = useTransform(rounded, (n) => (format ? format(n) : n.toLocaleString('pt-BR')))

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [inView, value, duration, motionVal])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: build succeeds. (The component isn't used yet but must compile.)

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/animations/number-counter.tsx
git commit -m "feat(web): add NumberCounter primitive for animated metrics"
```

---

## Task 3: Build GitHub stats lib (fetch + cache + fallback)

**Files:**
- Create: `web/lib/github-stats.ts`
- Create: `web/lib/use-github-stats.ts`

- [ ] **Step 1: Write the fetch + cache library**

Create `web/lib/github-stats.ts`:

```ts
export type GitHubStats = {
  stars: number
  forks: number
  contributors: number
  releases: number
  fetchedAt: number
}

const REPO = 'Luccas-carvalho/DevSenses'
const CACHE_KEY = 'devsenses:gh-stats'
const TTL_MS = 60 * 60 * 1000 // 1h

export const FALLBACK_STATS: GitHubStats = {
  stars: 100,
  forks: 8,
  contributors: 1,
  releases: 1,
  fetchedAt: 0,
}

export function readCache(): GitHubStats | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GitHubStats
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(stats: GitHubStats) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage may be disabled (private mode); ignore
  }
}

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const headers: HeadersInit = { Accept: 'application/vnd.github+json' }
  const [repoRes, contribRes, releasesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}`, { headers }),
    fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=100&anon=true`, { headers }),
    fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers }),
  ])

  if (!repoRes.ok) throw new Error(`GitHub repo fetch failed: ${repoRes.status}`)

  const repo = (await repoRes.json()) as { stargazers_count: number; forks_count: number }
  const contributors = contribRes.ok ? ((await contribRes.json()) as unknown[]).length : FALLBACK_STATS.contributors
  const releases = releasesRes.ok ? ((await releasesRes.json()) as unknown[]).length : FALLBACK_STATS.releases

  const stats: GitHubStats = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    contributors,
    releases,
    fetchedAt: Date.now(),
  }
  writeCache(stats)
  return stats
}
```

- [ ] **Step 2: Write the hook**

Create `web/lib/use-github-stats.ts`:

```ts
'use client'
import { useEffect, useState } from 'react'
import { FALLBACK_STATS, fetchGitHubStats, readCache, type GitHubStats } from './github-stats'

export function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats>(() => readCache() ?? FALLBACK_STATS)
  const [loaded, setLoaded] = useState<boolean>(() => readCache() !== null)

  useEffect(() => {
    if (loaded) return
    let cancelled = false
    fetchGitHubStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s)
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [loaded])

  return stats
}
```

- [ ] **Step 3: Manual verification in browser console**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run dev
```

Open `http://localhost:3000` and run in browser DevTools console:

```js
const m = await import('/lib/github-stats.ts').catch(() => null)
```

That probably won't import directly. Alternative manual check: paste this in console and run:

```js
fetch('https://api.github.com/repos/Luccas-carvalho/DevSenses')
  .then(r => r.json())
  .then(r => console.log('stars:', r.stargazers_count, 'forks:', r.forks_count))
```

Expected: prints non-NaN numbers. If 404, the repo URL is wrong — verify with the user before continuing. Stop dev server.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/lib/github-stats.ts web/lib/use-github-stats.ts
git commit -m "feat(web): add github stats lib with localStorage cache and fallback"
```

---

## Task 4: Build CanvasField primitive (falling comets)

**Files:**
- Create: `web/components/animations/canvas-field.tsx`

- [ ] **Step 1: Write the canvas component**

Create `web/components/animations/canvas-field.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'

type Comet = { x: number; y: number; vx: number; vy: number; len: number; alpha: number }

type Props = {
  density?: number // number of active comets, default 10
  className?: string
}

export function CanvasField({ density = 10, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let dpr = window.devicePixelRatio || 1
    let width = 0
    let height = 0
    let raf = 0
    let running = true

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (): Comet => ({
      x: Math.random() * width,
      y: -20 - Math.random() * 200,
      vx: 0.4 + Math.random() * 0.8,
      vy: 0.9 + Math.random() * 1.6,
      len: 60 + Math.random() * 80,
      alpha: 0.4 + Math.random() * 0.45,
    })

    const comets: Comet[] = Array.from({ length: density }, spawn)

    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < comets.length; i++) {
        const c = comets[i]
        c.x += c.vx
        c.y += c.vy
        if (c.y - c.len > height || c.x > width + 50) {
          comets[i] = spawn()
          continue
        }
        const tailX = c.x - c.vx * c.len
        const tailY = c.y - c.vy * c.len
        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY)
        grad.addColorStop(0, `hsla(258, 90%, 76%, ${c.alpha})`)
        grad.addColorStop(1, 'hsla(258, 90%, 66%, 0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(c.x, c.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      dpr = window.devicePixelRatio || 1
      resize()
    }
    window.addEventListener('resize', onResize)

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          running = entry.isIntersecting
          if (running && !raf) raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onVis = () => {
      running = document.visibilityState === 'visible'
      if (running && !raf) raf = requestAnimationFrame(tick)
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      io.disconnect()
    }
  }, [density])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className ?? 'absolute inset-0 w-full h-full pointer-events-none'}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/animations/canvas-field.tsx
git commit -m "feat(web): add CanvasField with falling comets and reduced-motion support"
```

---

## Task 5: Modify GalaxyBackdrop to orbits-only mode

**Files:**
- Modify: `web/components/animations/galaxy-backdrop.tsx`

- [ ] **Step 1: Update the component**

Open `web/components/animations/galaxy-backdrop.tsx`. Replace the function signature line and the stars block.

Change the signature from:

```tsx
export function GalaxyBackdrop({ density = 'normal' }: { density?: 'sparse' | 'normal' | 'dense' }) {
```

to:

```tsx
export function GalaxyBackdrop({ density = 'normal', orbitsOnly = false }: { density?: 'sparse' | 'normal' | 'dense'; orbitsOnly?: boolean }) {
```

Then wrap the stars block (the `<div className="absolute inset-0">` that maps over `stars.map(...)`) so it only renders when `!orbitsOnly`:

```tsx
      {/* Stars */}
      {!orbitsOnly && (
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <span
              key={i}
              className={`ds-galaxy-star ${star.bright ? 'is-bright' : ''}`}
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay.toFixed(2)}s`,
                animationDuration: `${star.duration.toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      )}
```

Keep nebulae, orbits, and rays unchanged — those are not stars.

- [ ] **Step 2: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: build succeeds. Existing callers (`<GalaxyBackdrop density="dense" />`) still work unchanged.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/animations/galaxy-backdrop.tsx
git commit -m "feat(web): add orbitsOnly variant to GalaxyBackdrop"
```

---

## Task 6: Modify MouseSpotlight for smoke distortion

**Files:**
- Modify: `web/components/animations/mouse-spotlight.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Replace the component with the variant-aware version**

Replace the entire contents of `web/components/animations/mouse-spotlight.tsx` with:

```tsx
'use client'
import { useEffect, useRef } from 'react'

type Variant = 'spot' | 'smoke'

export function MouseSpotlight({
  size = 600,
  opacity = 0.15,
  variant = 'spot',
}: {
  size?: number
  opacity?: number
  variant?: Variant
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0

    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.parentElement!.getBoundingClientRect()
      tx = e.clientX - rect.left
      ty = e.clientY - rect.top
    }

    const tick = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      const el = ref.current
      if (el) el.style.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const parent = ref.current?.parentElement
    parent?.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      parent?.removeEventListener('mousemove', onMove)
    }
  }, [size])

  if (variant === 'smoke') {
    return (
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 will-change-transform mix-blend-screen"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl ds-smoke-breathe"
          style={{
            background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / ${opacity}) 0%, transparent 65%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full blur-2xl ds-smoke-breathe"
          style={{
            background: `radial-gradient(circle at 45% 55%, hsl(var(--primary) / ${opacity * 0.7}) 0%, transparent 60%)`,
            animationDelay: '-1.2s',
            transform: 'translate(-30px, 20px)',
          }}
        />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 rounded-full blur-3xl will-change-transform"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, hsl(var(--primary) / ${opacity}) 0%, transparent 70%)`,
      }}
    />
  )
}
```

- [ ] **Step 2: Add the breathe keyframes to globals.css**

Append to the bottom of `web/app/globals.css`:

```css
@keyframes ds-smoke-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.92; }
}

.ds-smoke-breathe {
  animation: ds-smoke-breathe 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ds-smoke-breathe {
    animation: none;
  }
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/animations/mouse-spotlight.tsx web/app/globals.css
git commit -m "feat(web): add smoke variant to MouseSpotlight"
```

---

## Task 7: Build DemoPlayer container

**Files:**
- Create: `web/components/animations/demo-player.tsx`

- [ ] **Step 1: Write the container**

Create `web/components/animations/demo-player.tsx`:

```tsx
'use client'
import { useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  ariaLabel: string
}

export function DemoPlayer({ children, className, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-10% 0px' })

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      data-playing={inView ? 'true' : 'false'}
      className={
        className ??
        'relative w-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 overflow-hidden'
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
      {inView && children}
    </div>
  )
}
```

Demos consume the `data-playing` attribute via CSS attribute selectors (`[data-playing="true"] .my-anim { animation-play-state: running }`) to gate their CSS animations.

- [ ] **Step 2: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/animations/demo-player.tsx
git commit -m "feat(web): add DemoPlayer container with viewport gating"
```

---

## Task 8: Build AdaptiveDemo (depth slider)

**Files:**
- Create: `web/components/demos/adaptive-demo.tsx`

- [ ] **Step 1: Write the demo**

Create `web/components/demos/adaptive-demo.tsx`:

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const LEVELS = [
  { label: 'Criança', body: 'Computador esqueceu. Vc lembra ele.' },
  { label: 'Júnior', body: 'useState guarda valor entre renders.' },
  { label: 'Pleno', body: 'Hook que materializa estado local fora do render tree.' },
  { label: 'Sênior', body: 'Closure-stable setter, batched updates, fiber-resident.' },
  { label: 'Algoritmista', body: 'Reconciler armazena em hook linked list, O(1) por dispatch.' },
] as const

export function AdaptiveDemo() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LEVELS.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center gap-1.5">
        {LEVELS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Profundidade</span>
        <span className="text-primary">{LEVELS[idx].label}</span>
      </div>
      <div className="relative min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-foreground/90 leading-relaxed"
          >
            {LEVELS[idx].body}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/demos/adaptive-demo.tsx
git commit -m "feat(web): add AdaptiveDemo with rotating depth levels"
```

---

## Task 9: Build PowerDemo (⌘K selection + tooltip)

**Files:**
- Create: `web/components/demos/power-demo.tsx`

- [ ] **Step 1: Write the demo**

Create `web/components/demos/power-demo.tsx`:

```tsx
'use client'
import { motion } from 'framer-motion'

export function PowerDemo() {
  return (
    <div className="relative font-mono text-[11px] leading-relaxed text-foreground/85">
      <pre className="m-0 whitespace-pre-wrap select-none">
        {'const total = items.reduce(\n  (acc, x) => acc + x.price,\n  0\n)'}
      </pre>

      {/* selection highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.2, 0.85, 1], ease: 'easeInOut' }}
        className="absolute left-0 right-0 top-[1.4em] h-[1.4em] bg-primary/30 rounded-sm pointer-events-none"
      />

      {/* tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, -4] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.25, 0.35, 0.85, 1], ease: 'easeOut' }}
        className="absolute left-2 top-[3em] flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-primary/40 text-[10px] shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.5)]"
      >
        <kbd className="px-1 py-px rounded bg-background/80 border border-border text-primary">⌘K</kbd>
        <span className="text-foreground/80">Explicar trecho</span>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/demos/power-demo.tsx
git commit -m "feat(web): add PowerDemo with cmd-k selection and tooltip"
```

---

## Task 10: Build FoundationDemo (providers + local badge)

**Files:**
- Create: `web/components/demos/foundation-demo.tsx`

- [ ] **Step 1: Write the demo**

Create `web/components/demos/foundation-demo.tsx`:

```tsx
'use client'
import { motion } from 'framer-motion'

const PROVIDERS = ['Claude', 'Codex', 'Gemini', 'Aider', 'Ollama']

export function FoundationDemo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PROVIDERS.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 1, 1, 0.25] }}
            transition={{
              duration: 2.5,
              delay: i * 0.4,
              repeat: Infinity,
              times: [0, 0.25, 0.7, 1],
              ease: 'easeInOut',
            }}
            className="px-2.5 py-1 rounded-md bg-card border border-border font-mono text-[10px] uppercase tracking-widest text-foreground/85"
          >
            {name}
          </motion.span>
        ))}
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/[0.08] font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
          <span className="relative size-1.5 rounded-full bg-primary" />
        </span>
        100% local · BYOK
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/demos/foundation-demo.tsx
git commit -m "feat(web): add FoundationDemo with rotating provider chips"
```

---

## Task 11: Rewrite Hero

**Files:**
- Modify: `web/components/sections/hero.tsx`
- Modify: `web/messages/pt/hero.json`
- Modify: `web/messages/en/hero.json`

- [ ] **Step 1: Update PT hero copy**

Replace `web/messages/pt/hero.json` with:

```json
{
  "headline": "Entenda o código que sua IA escreveu.",
  "sub": "DevSenses lê seu diff, explica linha por linha no seu nível, e prova com quiz que você entendeu.",
  "cta_primary": "Star no GitHub",
  "cta_secondary": "Ver features",
  "tagline_top": "Open source · MIT",
  "metrics_label_stars": "stars",
  "metrics_label_release": "última release",
  "metrics_label_license": "MIT License"
}
```

- [ ] **Step 2: Update EN hero copy**

Replace `web/messages/en/hero.json` with:

```json
{
  "headline": "Understand the code your AI wrote.",
  "sub": "DevSenses reads your diff, explains line by line at your level, and proves with a quiz that you got it.",
  "cta_primary": "Star on GitHub",
  "cta_secondary": "See features",
  "tagline_top": "Open source · MIT",
  "metrics_label_stars": "stars",
  "metrics_label_release": "latest release",
  "metrics_label_license": "MIT License"
}
```

- [ ] **Step 3: Rewrite Hero component**

Replace the entire contents of `web/components/sections/hero.tsx` with:

```tsx
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Star } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { GalaxyBackdrop } from '@/components/animations/galaxy-backdrop'
import { MouseSpotlight } from '@/components/animations/mouse-spotlight'
import { CanvasField } from '@/components/animations/canvas-field'
import { HeroMetrics } from '@/components/sections/hero-metrics'

const REPO_URL = 'https://github.com/Luccas-carvalho/DevSenses'

export async function Hero() {
  const t = await getTranslations('hero')
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-28 pb-20">
      <GalaxyBackdrop density="dense" orbitsOnly />

      <div className="absolute inset-0 bg-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_20%,transparent_85%)] pointer-events-none" />

      <CanvasField density={10} />

      <MouseSpotlight size={650} opacity={0.16} variant="smoke" />

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-[2]" />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
        <FadeIn>
          <div className="group inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur-md text-xs font-mono shadow-[0_0_28px_-4px_hsl(var(--primary)/0.5)] hover:border-primary/55 transition-colors">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="relative size-2 rounded-full bg-primary" />
            </span>
            <span className="text-primary uppercase tracking-widest">{t('tagline_top')}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-[-0.05em] leading-[0.95] text-balance pb-2 max-w-4xl bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-transparent">
            {t('headline')}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            {t('sub')}
          </p>
        </FadeIn>

        <FadeIn delay={0.32}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-[0_0_36px_-6px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.85)] transition-shadow"
            >
              <Star size={14} className="fill-current" />
              <span>{t('cta_primary')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-card/60 backdrop-blur-md text-sm font-medium text-foreground/85 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <span>{t('cta_secondary')}</span>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.48}>
          <HeroMetrics />
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create HeroMetrics client component**

Create `web/components/sections/hero-metrics.tsx`:

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { Star, Tag, BadgeCheck } from 'lucide-react'
import { useGitHubStats } from '@/lib/use-github-stats'
import { NumberCounter } from '@/components/animations/number-counter'

export function HeroMetrics() {
  const t = useTranslations('hero')
  const stats = useGitHubStats()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <Star size={12} className="text-primary" />
        <NumberCounter value={stats.stars} className="text-foreground" />
        <span>{t('metrics_label_stars')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <BadgeCheck size={12} className="text-primary" />
        <span>{t('metrics_label_license')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <Tag size={12} className="text-primary" />
        <span>v0.1.0 · {t('metrics_label_release')}</span>
      </span>
    </div>
  )
}
```

(Release version is currently hardcoded. Hooking it up to the github-stats API for the actual release tag is out of scope for this redesign — leave the `v0.1.0` placeholder and accept a follow-up TODO comment is unnecessary; just leave it.)

- [ ] **Step 5: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Visual smoke check**

```bash
npm run dev
```

Open `http://localhost:3000`. Hero shows: pill `OPEN SOURCE · MIT`, new headline, sub, two CTAs, three metric pills. Background has falling comets and smoke spotlight following cursor. No AppShowcase below the CTAs. Stop dev server.

- [ ] **Step 7: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/hero.tsx web/components/sections/hero-metrics.tsx web/messages/pt/hero.json web/messages/en/hero.json
git commit -m "feat(web): rewrite Hero with comets, smoke spotlight, live stars"
```

---

## Task 12: Merge Pain into Solution

**Files:**
- Modify: `web/components/sections/solution.tsx`
- Modify: `web/messages/pt/solution.json`
- Modify: `web/messages/en/solution.json`

- [ ] **Step 1: Read current solution.tsx to understand layout**

```bash
cat /Users/luccas/Documents/Github/DevSenses/web/components/sections/solution.tsx
```

Note the current structure (eyebrow, title, sub, demo block).

- [ ] **Step 2: Update PT solution copy to absorb Pain content**

Replace `web/messages/pt/solution.json` with:

```json
{
  "pain_eyebrow": "Você commita. Mas entende?",
  "pain_bullets": [
    "Cola código da IA sem ler o diff.",
    "Aceita sugestão sem saber o porquê.",
    "Trava no próximo bug porque não entendeu o anterior.",
    "Vibe coder produtivo, dev no escuro."
  ],
  "title": "Toda alteração vira aula.",
  "sub": "DevSenses lê seu git diff. Explica o que mudou no SEU nível. Ensina o conceito por trás. Te força a entender.",
  "demo_label": "git diff explicado:",
  "demo_diff": "+ const [count, setCount] = useState(0)\n+ useEffect(() => {\n+   document.title = `Count: ${count}`\n+ }, [count])",
  "demo_explanation": [
    "useState cria estado local. count guarda valor, setCount atualiza.",
    "useEffect roda código após render. Aqui sincroniza o title do documento.",
    "Array [count] é dependência: effect roda quando count muda.",
    "Sem dependência = roda todo render. Com [] = roda 1x."
  ]
}
```

- [ ] **Step 3: Update EN solution copy**

Replace `web/messages/en/solution.json` with:

```json
{
  "pain_eyebrow": "You commit. But do you understand?",
  "pain_bullets": [
    "Pasting AI code without reading the diff.",
    "Accepting suggestions without knowing why.",
    "Stuck on the next bug because you missed the last one.",
    "Productive vibe coder, dev in the dark."
  ],
  "title": "Every change becomes a lesson.",
  "sub": "DevSenses reads your git diff. Explains what changed at YOUR level. Teaches the concept behind it. Forces you to understand.",
  "demo_label": "git diff explained:",
  "demo_diff": "+ const [count, setCount] = useState(0)\n+ useEffect(() => {\n+   document.title = `Count: ${count}`\n+ }, [count])",
  "demo_explanation": [
    "useState creates local state. count holds the value, setCount updates it.",
    "useEffect runs after render. Here it syncs the document title.",
    "[count] array is the dependency: effect runs when count changes.",
    "No deps = runs every render. [] = runs once."
  ]
}
```

- [ ] **Step 4: Update Solution component to render Pain bullets above the title**

In `web/components/sections/solution.tsx`, add a block above the existing title that reads:

```tsx
{/* Pain bullets — absorbed from former Pain section */}
<div className="max-w-2xl mx-auto mb-12 text-center">
  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/70 mb-4">
    {t('pain_eyebrow')}
  </p>
  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/80">
    {(t.raw('pain_bullets') as string[]).map((b) => (
      <li key={b} className="px-3 py-2 rounded-md border border-border/60 bg-card/40">
        {b}
      </li>
    ))}
  </ul>
</div>
```

Place this block immediately after the section opening container but before the existing title block. Keep the existing title, sub, and demo unchanged.

- [ ] **Step 5: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Visual smoke check**

```bash
npm run dev
```

Open `http://localhost:3000`. Solution section now shows pain eyebrow + 4 bullets above the existing "Toda alteração vira aula." title. The old separate Pain section will still render until Task 18 reorders the page. Stop dev server.

- [ ] **Step 7: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/solution.tsx web/messages/pt/solution.json web/messages/en/solution.json
git commit -m "feat(web): merge Pain bullets into Solution as eyebrow"
```

---

## Task 13: Update FeaturePillar to Layout B (DemoPlayer in side header)

**Files:**
- Modify: `web/components/sections/feature-pillar.tsx`
- Modify: `web/components/sections/features.tsx`

- [ ] **Step 1: Update FeaturePillar to accept a demo render slot**

Replace the contents of `web/components/sections/feature-pillar.tsx` with:

```tsx
'use client'
import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { Stagger, staggerItem } from '@/components/animations/stagger'
import { Icon } from '@/components/icon'
import { DemoPlayer } from '@/components/animations/demo-player'

type Item = { icon: string; title: string; description: string }
type Pillar = { id: string; label: string; title: string; description: string; items: Item[] }

export function FeaturePillar({
  pillar,
  flipped,
  index,
  demo,
  demoAriaLabel,
}: {
  pillar: Pillar
  flipped: boolean
  index: number
  demo: ReactNode
  demoAriaLabel: string
}) {
  return (
    <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-10 lg:gap-14 items-start">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className={`relative ${flipped ? 'lg:order-2' : ''}`}
      >
        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur-md">
            <span className="font-mono text-[10px] font-bold text-primary tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/90">
              {pillar.label}
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {pillar.title}
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed text-balance">
            {pillar.description}
          </p>
          <DemoPlayer ariaLabel={demoAriaLabel} className="relative w-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-5 overflow-hidden mt-2">
            {demo}
          </DemoPlayer>
        </div>
      </motion.div>

      <Stagger className={`grid sm:grid-cols-2 gap-4 ${flipped ? 'lg:order-1' : ''}`}>
        {pillar.items.map((item) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.16 }}
            className="group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 shadow-[0_0_18px_-6px_hsl(var(--primary)/0.4)] group-hover:bg-primary/15 group-hover:border-primary/40 transition-colors">
                <Icon name={item.icon} size={18} />
              </div>
              <h4 className="font-semibold tracking-tight text-base">{item.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </Stagger>
    </div>
  )
}
```

Notable changes:
- Removed `sticky top-24` (would cause the demo to scroll past the items; remove sticky entirely for this layout)
- Added `<DemoPlayer />` slot
- Tightened tracking to `-0.05em`

- [ ] **Step 2: Wire demos in Features**

Replace `web/components/sections/features.tsx` with:

```tsx
import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { FeaturePillar } from './feature-pillar'
import { AdaptiveDemo } from '@/components/demos/adaptive-demo'
import { PowerDemo } from '@/components/demos/power-demo'
import { FoundationDemo } from '@/components/demos/foundation-demo'

type Item = { icon: string; title: string; description: string }
type Pillar = { id: string; label: string; title: string; description: string; items: Item[] }

const DEMOS: Record<string, { node: React.ReactNode; aria: string }> = {
  adaptive: { node: <AdaptiveDemo />, aria: 'Demo: slider de profundidade rotacionando 5 níveis' },
  power: { node: <PowerDemo />, aria: 'Demo: atalho cmd-K com seleção e tooltip' },
  foundation: { node: <FoundationDemo />, aria: 'Demo: providers rotacionando com badge 100% local' },
}

export async function Features() {
  const t = await getTranslations('features')
  const pillars = t.raw('pillars') as Pillar[]
  return (
    <section id="features" className="relative px-6 py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.18] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <SectionLabel number="04" className="mb-5">
              {t('subtitle')}
            </SectionLabel>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="flex flex-col gap-24">
          {pillars.map((pillar, i) => {
            const demo = DEMOS[pillar.id] ?? DEMOS.adaptive
            return (
              <FeaturePillar
                key={pillar.id}
                pillar={pillar}
                flipped={i % 2 === 1}
                index={i}
                demo={demo.node}
                demoAriaLabel={demo.aria}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Visual smoke check**

```bash
npm run dev
```

Open `http://localhost:3000`, scroll to Features. Each pillar's side header now contains a small demo below the description. Pillar 2 (Power tools, 6 items) no longer has a huge empty space — the demo fills it. Stop dev server.

- [ ] **Step 5: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/feature-pillar.tsx web/components/sections/features.tsx
git commit -m "feat(web): add per-pillar demos to fill empty header space"
```

---

## Task 14: Build Install section + i18n

**Files:**
- Create: `web/components/sections/install.tsx`
- Create: `web/messages/pt/install.json`
- Create: `web/messages/en/install.json`
- Modify: `web/i18n/request.ts`

- [ ] **Step 1: Add `install` namespace to i18n request config**

Open `web/i18n/request.ts`. In the `NAMESPACES` tuple, **add** `'install'` and `'stats'`, and **remove** `'pain'` and `'pricing'`. Result should be:

```ts
const NAMESPACES = ['common','hero','solution','showcase','features','how-it-works','providers','install','stats','faq','footer'] as const
```

- [ ] **Step 2: Write PT install copy**

Create `web/messages/pt/install.json`:

```json
{
  "subtitle": "Install",
  "title": "Instala em 30 segundos.",
  "sub": "macOS, Linux, Windows. Sem cadastro.",
  "tabs": {
    "macos": "macOS",
    "linux": "Linux",
    "windows": "Windows"
  },
  "macos_command": "# Download .dmg da última release\\nopen https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "linux_command": "# Download .AppImage da última release\\nxdg-open https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "windows_command": "# Download .exe da última release\\nstart https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "build_from_source": "Ou build from source",
  "copied": "Copiado!"
}
```

- [ ] **Step 3: Write EN install copy**

Create `web/messages/en/install.json`:

```json
{
  "subtitle": "Install",
  "title": "Install in 30 seconds.",
  "sub": "macOS, Linux, Windows. No signup.",
  "tabs": {
    "macos": "macOS",
    "linux": "Linux",
    "windows": "Windows"
  },
  "macos_command": "# Download the .dmg from latest release\\nopen https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "linux_command": "# Download the .AppImage from latest release\\nxdg-open https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "windows_command": "# Download the .exe from latest release\\nstart https://github.com/Luccas-carvalho/DevSenses/releases/latest",
  "build_from_source": "Or build from source",
  "copied": "Copied!"
}
```

- [ ] **Step 4: Build Install section**

Create `web/components/sections/install.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Apple, MonitorSmartphone, Copy, Check, ArrowUpRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'

type Os = 'macos' | 'linux' | 'windows'

const OS_ICONS: Record<Os, typeof Apple> = {
  macos: Apple,
  linux: MonitorSmartphone,
  windows: MonitorSmartphone,
}

export function Install() {
  const t = useTranslations('install')
  const [os, setOs] = useState<Os>('macos')
  const [copied, setCopied] = useState(false)

  const command = t(`${os}_command`)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard may be blocked; ignore
    }
  }

  return (
    <section id="install" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <FadeIn>
            <SectionLabel number="07" className="mb-5">
              {t('subtitle')}
            </SectionLabel>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-muted-foreground">{t('sub')}</p>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden">
            <div role="tablist" aria-label="Operating system" className="flex border-b border-border">
              {(['macos', 'linux', 'windows'] as const).map((key) => {
                const IconEl = OS_ICONS[key]
                const active = os === key
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setOs(key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'text-foreground bg-card'
                        : 'text-muted-foreground hover:text-foreground bg-background/40'
                    }`}
                  >
                    <IconEl size={14} />
                    {t(`tabs.${key}`)}
                  </button>
                )
              })}
            </div>

            <div className="p-5 font-mono text-[12px] leading-relaxed">
              <pre className="m-0 whitespace-pre-wrap text-foreground/90">{command}</pre>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background/40">
              <button
                onClick={onCopy}
                aria-label="Copy install command"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card hover:border-primary/40 text-xs text-foreground/85 transition-colors"
              >
                {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                {copied ? t('copied') : 'Copy'}
              </button>
              <a
                href="https://github.com/Luccas-carvalho/DevSenses#build-from-source"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('build_from_source')}
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/install.tsx web/messages/pt/install.json web/messages/en/install.json web/i18n/request.ts
git commit -m "feat(web): add Install section with tabbed OS commands"
```

---

## Task 15: Build Stats section + i18n

**Files:**
- Create: `web/components/sections/stats.tsx`
- Create: `web/messages/pt/stats.json`
- Create: `web/messages/en/stats.json`

- [ ] **Step 1: Write PT stats copy**

Create `web/messages/pt/stats.json`:

```json
{
  "subtitle": "Open Source Stats",
  "title": "Real, verificável, em código.",
  "cards": {
    "stars": "Stars",
    "forks": "Forks",
    "contributors": "Contribuidores",
    "releases": "Releases"
  },
  "see_on_github": "Ver no GitHub"
}
```

- [ ] **Step 2: Write EN stats copy**

Create `web/messages/en/stats.json`:

```json
{
  "subtitle": "Open Source Stats",
  "title": "Real, verifiable, in code.",
  "cards": {
    "stars": "Stars",
    "forks": "Forks",
    "contributors": "Contributors",
    "releases": "Releases"
  },
  "see_on_github": "See on GitHub"
}
```

- [ ] **Step 3: Build Stats section**

Create `web/components/sections/stats.tsx`:

```tsx
'use client'
import { useTranslations } from 'next-intl'
import { Star, GitFork, Users, Tag, ArrowUpRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { NumberCounter } from '@/components/animations/number-counter'
import { useGitHubStats } from '@/lib/use-github-stats'

const REPO = 'https://github.com/Luccas-carvalho/DevSenses'

export function Stats() {
  const t = useTranslations('stats')
  const stats = useGitHubStats()

  const cards = [
    { key: 'stars', value: stats.stars, Icon: Star, href: `${REPO}/stargazers` },
    { key: 'forks', value: stats.forks, Icon: GitFork, href: `${REPO}/network/members` },
    { key: 'contributors', value: stats.contributors, Icon: Users, href: `${REPO}/graphs/contributors` },
    { key: 'releases', value: stats.releases, Icon: Tag, href: `${REPO}/releases` },
  ] as const

  return (
    <section id="stats" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <FadeIn>
            <SectionLabel number="08" className="mb-5">
              {t('subtitle')}
            </SectionLabel>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ key, value, Icon: IconEl, href }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md hover:border-primary/40 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <IconEl size={16} />
                </div>
                <NumberCounter
                  value={value}
                  className="text-3xl font-bold tracking-[-0.04em] text-foreground tabular-nums"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(`cards.${key}`)}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </a>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/stats.tsx web/messages/pt/stats.json web/messages/en/stats.json
git commit -m "feat(web): add Stats section with live GitHub counters"
```

---

## Task 16: Update FAQ copy (remove waitlist, add contrib/roadmap)

**Files:**
- Modify: `web/messages/pt/faq.json`
- Modify: `web/messages/en/faq.json`

- [ ] **Step 1: Replace PT FAQ**

Replace `web/messages/pt/faq.json` with:

```json
{
  "title": "Perguntas honestas.",
  "subtitle": "Respostas honestas.",
  "items": [
    {
      "q": "DevSenses substitui Cursor/Copilot?",
      "a": "Não. Roda do lado, te ensina o que eles fazem. Você continua usando o que já gosta."
    },
    {
      "q": "Funciona offline?",
      "a": "Com Ollama, sim. 100% local, diff nunca sai do device."
    },
    {
      "q": "É open source mesmo?",
      "a": "Sim. MIT. Forka, contribui, audita. Disponível agora no GitHub."
    },
    {
      "q": "Preciso pagar IA?",
      "a": "BYOK. Você usa sua key da Anthropic/OpenAI/Google ou roda Ollama de graça localmente."
    },
    {
      "q": "Tem versão paga?",
      "a": "Não. Tudo é grátis. Se ajudar, considera GitHub Sponsors."
    },
    {
      "q": "Como contribuir?",
      "a": "Repo no GitHub tem good-first-issue marcadas. Lê o CONTRIBUTING.md e abre PR."
    },
    {
      "q": "Roadmap?",
      "a": "Público no GitHub Projects. Vota nas issues que tu queres ver primeiro."
    }
  ]
}
```

- [ ] **Step 2: Replace EN FAQ**

Replace `web/messages/en/faq.json` with:

```json
{
  "title": "Honest questions.",
  "subtitle": "Honest answers.",
  "items": [
    {
      "q": "Does DevSenses replace Cursor/Copilot?",
      "a": "No. Runs alongside, teaches you what they do. Keep using what you already like."
    },
    {
      "q": "Does it work offline?",
      "a": "With Ollama, yes. 100% local, diff never leaves your device."
    },
    {
      "q": "Is it really open source?",
      "a": "Yes. MIT. Fork, contribute, audit. Available now on GitHub."
    },
    {
      "q": "Do I need to pay for AI?",
      "a": "BYOK. Use your Anthropic/OpenAI/Google key or run Ollama locally for free."
    },
    {
      "q": "Is there a paid version?",
      "a": "No. Everything is free. If it helps, consider GitHub Sponsors."
    },
    {
      "q": "How do I contribute?",
      "a": "Repo has good-first-issue labels. Read CONTRIBUTING.md and open a PR."
    },
    {
      "q": "Roadmap?",
      "a": "Public on GitHub Projects. Vote on issues you want shipped first."
    }
  ]
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/messages/pt/faq.json web/messages/en/faq.json
git commit -m "refactor(web): refresh FAQ — drop waitlist, add contrib and roadmap"
```

---

## Task 17: Update remaining copy (footer, features pillars where needed)

**Files:**
- Modify: `web/messages/pt/footer.json`
- Modify: `web/messages/en/footer.json`
- Modify: `web/components/sections/footer.tsx`

- [ ] **Step 1: Read current footer copy**

```bash
cat /Users/luccas/Documents/Github/DevSenses/web/messages/pt/footer.json
cat /Users/luccas/Documents/Github/DevSenses/web/messages/en/footer.json
```

If the tagline or copyright mentions "em breve", "waitlist", or "launch", rewrite to match the open-source positioning. If it doesn't, leave both files unchanged. Example PT update if needed:

```json
{
  "tagline": "Open source. MIT. Forka se quiser.",
  "copyright": "© 2026 DevSenses. MIT License."
}
```

- [ ] **Step 2: Remove broken Discord link from footer component**

The footer currently has `<MessageCircle />` linking to `#` (Discord placeholder). Open `web/components/sections/footer.tsx` and delete that single `<a>` block (the one with `aria-label="Discord"`). Keep GitHub, Twitter/X (if not broken), and Email.

Also: normalize the repo URL — the footer currently uses `Luccas-carvalho/DevSenses` and the Hero now uses the same; confirm both match. If the Twitter link is `#`, leave it but the user may want to remove it — note as a TODO comment is not allowed per project policy; instead, if `href="#"`, delete that anchor too. Do not introduce dead links.

- [ ] **Step 3: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/components/sections/footer.tsx web/messages/pt/footer.json web/messages/en/footer.json
git commit -m "refactor(web): drop dead footer links and align copy with open source"
```

---

## Task 18: Update page.tsx and delete Pain/Pricing/Waitlist in one atomic commit

This task updates the page imports AND deletes the corresponding files in a single commit, so the build never lands in a broken intermediate state.

**Files:**
- Modify: `web/app/[locale]/page.tsx`
- Delete: `web/components/sections/pain.tsx`
- Delete: `web/components/sections/pain-list.tsx`
- Delete: `web/components/sections/pricing.tsx`
- Delete: `web/components/sections/pricing-card.tsx`
- Delete: `web/components/waitlist-form.tsx`
- Delete: `web/messages/pt/pain.json`
- Delete: `web/messages/en/pain.json`
- Delete: `web/messages/pt/pricing.json`
- Delete: `web/messages/en/pricing.json`
- Delete: `web/app/api/waitlist/route.ts` (the waitlist API route — no longer needed)

- [ ] **Step 1: Replace page.tsx with the new section order**

Replace the contents of `web/app/[locale]/page.tsx` with:

```tsx
import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Hero } from '@/components/sections/hero'
import { Marquee } from '@/components/animations/marquee'
import { Solution } from '@/components/sections/solution'
import { Showcase } from '@/components/sections/showcase'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Providers } from '@/components/sections/providers'
import { Install } from '@/components/sections/install'
import { Stats } from '@/components/sections/stats'
import { Faq } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee items={['Resumo', 'Detalhes', 'Conceitos', 'Quiz adaptativo', '⌘K Cheat Sheet', 'Modo Socrático', 'What if?', 'Caça ao bug', 'Big-O auto-detect', 'Detecção autoria IA', 'Glossário pessoal', '5 IAs · BYOK', '100% local']} />
        <Solution />
        <Showcase />
        <Features />
        <HowItWorks />
        <Providers />
        <Install />
        <Stats />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify build succeeds (imports are gone — files still exist but orphaned)**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds. Pain/Pricing/Waitlist files still on disk but unreferenced.

- [ ] **Step 3: Confirm no remaining references in any source file**

```bash
cd /Users/luccas/Documents/Github/DevSenses
grep -rn "from '@/components/sections/pain" web/ 2>/dev/null
grep -rn "from '@/components/sections/pricing" web/ 2>/dev/null
grep -rn "from '@/components/waitlist" web/ 2>/dev/null
grep -rn "PainList\|PricingCard\|WaitlistForm" web/ 2>/dev/null
```

Expected: all four commands print nothing. If anything matches, open that file and remove the import + usage before proceeding.

- [ ] **Step 4: Delete the now-orphaned files**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git rm web/components/sections/pain.tsx
git rm web/components/sections/pain-list.tsx
git rm web/components/sections/pricing.tsx
git rm web/components/sections/pricing-card.tsx
git rm web/components/waitlist-form.tsx
git rm web/messages/pt/pain.json
git rm web/messages/en/pain.json
git rm web/messages/pt/pricing.json
git rm web/messages/en/pricing.json
git rm web/app/api/waitlist/route.ts
```

If `web/app/api/waitlist/` directory is now empty after removing `route.ts`, remove the empty directory too:

```bash
rmdir web/app/api/waitlist 2>/dev/null || true
```

- [ ] **Step 5: Verify build still succeeds after deletes**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Commit (single atomic commit covers reorder + deletes)**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git add web/app/[locale]/page.tsx
git commit -m "feat(web): reorder landing — drop Pain/Pricing/Waitlist, add Install + Stats"
```

---

## Task 19: Delete now-unused AppShowcase component

**Files:**
- Delete: `web/components/app-showcase.tsx`

After Task 11 the Hero no longer imports `AppShowcase`. The Showcase section uses its own `showcase-item` components, not `AppShowcase`. So `app-showcase.tsx` is dead code.

- [ ] **Step 1: Verify nothing else imports it**

```bash
cd /Users/luccas/Documents/Github/DevSenses
grep -rn "from '@/components/app-showcase'" web/ 2>/dev/null
grep -rn "import.*AppShowcase" web/ 2>/dev/null
```

Expected: both commands print nothing. If either returns a match, that file still imports `AppShowcase` — open it, remove the import and the JSX usage, then re-run the greps until clean before proceeding.

- [ ] **Step 2: Delete the file**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git rm web/components/app-showcase.tsx
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
npm run build
```

Expected: succeeds. If it fails, the AppShowcase removal broke something — open the failing file and either restore the import or remove the usage.

- [ ] **Step 4: Commit**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git commit -m "chore(web): drop unused AppShowcase mockup component"
```

---

## Task 20: Full QA pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build with no warnings**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
rm -rf .next
npm run build
```

Expected: build succeeds. No TypeScript errors. No "missing translation" warnings during build.

- [ ] **Step 2: Verify no leftover references to deleted entities**

```bash
cd /Users/luccas/Documents/Github/DevSenses
grep -rn "waitlist" web/ 2>/dev/null || echo "no waitlist refs"
grep -rn "PainList\|Pricing\b\|PricingCard" web/ 2>/dev/null || echo "no pain/pricing refs"
grep -rn "AppShowcase" web/ 2>/dev/null || echo "no AppShowcase refs"
```

Expected: three "no ... refs" lines. If anything matches, clean it up before continuing.

- [ ] **Step 3: Locale parity check**

```bash
cd /Users/luccas/Documents/Github/DevSenses/web
diff <(ls messages/pt) <(ls messages/en)
```

Expected: no output (file lists identical).

- [ ] **Step 4: Manual smoke test — PT locale**

```bash
npm run dev
```

Open `http://localhost:3000` and check:

- [ ] Hero shows pill, headline, sub, two CTAs, three metric pills
- [ ] Comets falling in Hero background
- [ ] Smoke spotlight follows cursor
- [ ] Marquee scrolls
- [ ] Solution shows Pain eyebrow + 4 bullets, then "Toda alteração vira aula." title
- [ ] Showcase section unchanged from baseline
- [ ] Features section: each pillar has demo in side column, no large empty space in pillar 2
- [ ] HowItWorks unchanged
- [ ] Providers unchanged
- [ ] Install: 3 tabs work, copy button copies, build-from-source link works
- [ ] Stats: 4 cards with NumberCounter animating from 0
- [ ] FAQ: no waitlist mention, contrib + roadmap questions present
- [ ] Footer: no broken Discord link

- [ ] **Step 5: Manual smoke test — EN locale**

Open `http://localhost:3000/en`. Walk through the same checks. All copy is English. No missing key console errors.

- [ ] **Step 6: Reduced-motion check**

In macOS: System Settings → Accessibility → Display → enable "Reduce motion". Reload the page. Verify:

- Comets do not animate (canvas stays blank or static)
- FadeIn/Stagger components either skip animation or use opacity-only
- DemoPlayer demos either pause or render static state

Disable reduced motion after testing.

- [ ] **Step 7: Mobile responsive check**

Open Chrome DevTools, switch to iPhone 14 Pro viewport. Verify:

- Hero CTAs stack vertically
- Features pillars: side header stacks above items
- Stats: 2-col on tablet, 1-col on mobile
- Install: tabs remain horizontal, code block scrolls horizontally if needed

- [ ] **Step 8: Lighthouse**

In DevTools → Lighthouse → Mobile → Performance. Run.

Expected: Performance ≥ 85. If lower, note the metric for follow-up but do not block on it (canvas is the most likely culprit; reducing comet count from 10 → 6 is a fast lever).

- [ ] **Step 9: Stop dev server, no commit (this task is verification only).**

---

## Task 21: Push branch and open PR

**Files:** none

- [ ] **Step 1: Push the branch**

```bash
cd /Users/luccas/Documents/Github/DevSenses
git push -u origin redesign/site-2026-05
```

- [ ] **Step 2: Open PR via gh**

```bash
gh pr create --title "Site redesign — open source positioning" --body "$(cat <<'EOF'
## Summary
- Refined dark theme tokens (240 hue, deeper background, sharper primary)
- New Hero with falling comets canvas, smoke spotlight, live GitHub stars
- Merged Pain into Solution; deleted standalone Pain section
- New per-pillar demos in Features (Adaptive/Power/Foundation) fill prior empty space
- Added Install section (macOS/Linux/Windows tabs with copy)
- Added Stats section (live stars/forks/contributors/releases)
- Removed Pricing, WaitlistForm, AppShowcase
- Updated FAQ — dropped waitlist, added contrib + roadmap entries
- PT and EN copy refreshed across all sections

## Spec
`docs/superpowers/specs/2026-05-18-site-redesign-design.md`

## Test plan
- [ ] `npm run build` clean
- [ ] Manual smoke PT at `/` — see spec §10 checklist
- [ ] Manual smoke EN at `/en` — same checklist
- [ ] Lighthouse mobile perf ≥ 85
- [ ] Reduced-motion respected
- [ ] No console errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm with the user**

The user must explicitly approve before pushing — **do not run the push or gh pr create without explicit confirmation in chat.** Per project memory: never commit/push without permission.

If the user has already given blanket approval at the start of execution, this step is unblocked. Otherwise, pause and ask.
