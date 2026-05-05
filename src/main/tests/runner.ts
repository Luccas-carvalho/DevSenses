import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { mkdir, readdir, stat, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { runsDir } from '../utils/paths'
import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

export type TestAction =
  | { action: 'goto'; url?: string; path?: string }
  | { action: 'fill'; selector: string; value: string }
  | { action: 'click'; selector: string }
  | { action: 'press'; selector: string; key: string }
  | { action: 'expectVisible'; selector: string }
  | { action: 'expectText'; selector: string; text: string }
  | { action: 'wait'; ms: number }
  | { action: 'screenshot'; name: string }

function joinUrl(baseUrl: string, path?: string): string {
  if (!path) return baseUrl
  if (/^https?:\/\//i.test(path)) return path
  const base = baseUrl.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base + p
}

export interface RunOptions {
  baseUrl: string
  actions: TestAction[]
  prompt?: string
  intensity?: 'sane' | 'chaos' | 'nuclear'
  recordVideo?: boolean
}

export interface LogEntry {
  index: number
  action: string
  ok: boolean
  detail?: string
  error?: string
  ts: number
}

export interface RunResult {
  id: string
  ok: boolean
  baseUrl: string
  prompt: string | null
  intensity: 'sane' | 'chaos' | 'nuclear'
  actionsCount: number
  startedAt: number
  finishedAt: number
  log: LogEntry[]
  screenshots: string[]
  videoPath: string | null
  error: string | null
  folder: string
}

function timestampedId(): string {
  const d = new Date()
  const pad = (n: number, w = 2): string => n.toString().padStart(w, '0')
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}` +
    `-${pad(d.getMilliseconds(), 3)}`
  )
}

async function executeAction(
  page: Page,
  action: TestAction,
  baseUrl: string,
  shotsDir: string,
  shotIndex: { value: number }
): Promise<{ detail?: string; screenshot?: string }> {
  switch (action.action) {
    case 'goto': {
      const target = action.url ? action.url : joinUrl(baseUrl, action.path)
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      return { detail: `→ ${target}` }
    }
    case 'fill': {
      await page.fill(action.selector, action.value, { timeout: 10_000 })
      return { detail: `${action.selector} ← "${action.value}"` }
    }
    case 'click': {
      await page.click(action.selector, { timeout: 10_000 })
      return { detail: action.selector }
    }
    case 'press': {
      await page.press(action.selector, action.key, { timeout: 10_000 })
      return { detail: `${action.selector} ${action.key}` }
    }
    case 'expectVisible': {
      const el = page.locator(action.selector).first()
      await el.waitFor({ state: 'visible', timeout: 10_000 })
      return { detail: action.selector }
    }
    case 'expectText': {
      const el = page.locator(action.selector).first()
      await el.waitFor({ state: 'visible', timeout: 10_000 })
      const text = (await el.textContent()) ?? ''
      if (!text.includes(action.text)) {
        throw new Error(
          `texto esperado "${action.text}" não encontrado. Atual: "${text.slice(0, 80)}"`
        )
      }
      return { detail: `"${action.text}" presente em ${action.selector}` }
    }
    case 'wait': {
      await page.waitForTimeout(action.ms)
      return { detail: `${action.ms}ms` }
    }
    case 'screenshot': {
      shotIndex.value++
      const safeName = action.name.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40)
      const file = `${String(shotIndex.value).padStart(2, '0')}-${safeName || 'shot'}.png`
      const fullPath = join(shotsDir, file)
      await page.screenshot({ path: fullPath, fullPage: true })
      return { detail: file, screenshot: fullPath }
    }
    default: {
      const _exhaustive: never = action
      void _exhaustive
      throw new Error('ação desconhecida')
    }
  }
}

export async function runTest(opts: RunOptions): Promise<RunResult> {
  const id = timestampedId()
  const folder = join(runsDir(), id)
  await mkdir(folder, { recursive: true })
  const shotsDir = join(folder, 'screenshots')
  await mkdir(shotsDir, { recursive: true })
  const videoDir = opts.recordVideo ? join(folder, 'video') : null
  if (videoDir) await mkdir(videoDir, { recursive: true })

  const startedAt = Date.now()
  const log: LogEntry[] = []
  const screenshots: string[] = []
  const shotIndex = { value: 0 }
  let videoPath: string | null = null
  let error: string | null = null
  let ok = true

  let browser: Browser | null = null
  let ctx: BrowserContext | null = null

  try {
    browser = await chromium.launch({ headless: true })
    ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: videoDir ? { dir: videoDir } : undefined
    })
    const page = await ctx.newPage()

    // Auto-prepend goto baseUrl if first action isn't goto
    const list = [...opts.actions]
    if (list.length === 0 || list[0].action !== 'goto') {
      list.unshift({ action: 'goto' })
    }

    for (let i = 0; i < list.length; i++) {
      const action = list[i]
      try {
        const r = await executeAction(page, action, opts.baseUrl, shotsDir, shotIndex)
        log.push({
          index: i,
          action: action.action,
          ok: true,
          detail: r.detail,
          ts: Date.now()
        })
        if (r.screenshot) screenshots.push(r.screenshot)
      } catch (e) {
        ok = false
        const errMsg = (e as Error).message
        // Capture an error screenshot
        try {
          shotIndex.value++
          const file = `${String(shotIndex.value).padStart(2, '0')}-error.png`
          const fullPath = join(shotsDir, file)
          await page.screenshot({ path: fullPath, fullPage: true })
          screenshots.push(fullPath)
        } catch {
          // ignore
        }
        log.push({
          index: i,
          action: action.action,
          ok: false,
          error: errMsg,
          ts: Date.now()
        })
        error = errMsg
        break
      }
    }

    // Always end with a final screenshot if none took
    if (ok && screenshots.length === 0) {
      try {
        const file = `00-final.png`
        const fullPath = join(shotsDir, file)
        await page.screenshot({ path: fullPath, fullPage: true })
        screenshots.push(fullPath)
      } catch {
        // ignore
      }
    }
  } catch (e) {
    ok = false
    error = (e as Error).message
  } finally {
    if (ctx) {
      try {
        await ctx.close()
      } catch {
        // ignore
      }
    }
    if (browser) {
      try {
        await browser.close()
      } catch {
        // ignore
      }
    }
  }

  // Capture video path if any
  if (videoDir) {
    try {
      const files = await readdir(videoDir)
      const webm = files.find((f) => f.endsWith('.webm'))
      if (webm) videoPath = join(videoDir, webm)
    } catch {
      // ignore
    }
  }

  return {
    id,
    ok,
    baseUrl: opts.baseUrl,
    prompt: opts.prompt ?? null,
    intensity: opts.intensity ?? 'sane',
    actionsCount: opts.actions.length,
    startedAt,
    finishedAt: Date.now(),
    log,
    screenshots,
    videoPath,
    error,
    folder
  }
}

export async function listRuns(): Promise<
  { id: string; folder: string; mtime: number }[]
> {
  const dir = runsDir()
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }
  const items: { id: string; folder: string; mtime: number }[] = []
  for (const name of entries) {
    try {
      const full = join(dir, name)
      const s = await stat(full)
      if (s.isDirectory()) items.push({ id: name, folder: full, mtime: s.mtimeMs })
    } catch {
      // ignore
    }
  }
  return items.sort((a, b) => b.mtime - a.mtime)
}

export async function deleteRun(id: string): Promise<void> {
  const dir = join(runsDir(), id)
  await rm(dir, { recursive: true, force: true })
}

// ============================================================
// AGENT MODE — IA vê estado da página + decide cada passo
// ============================================================

export interface AgentRunOptions {
  baseUrl: string
  goal: string
  intensity: 'sane' | 'chaos' | 'nuclear'
  providerId: ProviderId
  maxSteps?: number
  onEvent?: (event: AgentEvent) => void
}

export type AgentEvent =
  | { type: 'snapshot'; step: number; url: string; title: string; elementsCount: number }
  | { type: 'thinking'; step: number }
  | { type: 'action'; step: number; action: string; detail?: string; ok: boolean; error?: string }
  | { type: 'done'; reason: string }
  | { type: 'fail'; reason: string }

interface ElementSummary {
  id: number
  tag: string
  role: string | null
  text: string
  type: string | null
  name: string | null
  placeholder: string | null
  value: string | null
  href: string | null
  ariaLabel: string | null
}

interface PageSnapshot {
  url: string
  title: string
  elements: ElementSummary[]
  visibleText: string
}

const DEFAULT_MAX_STEPS = 12

async function callProvider(providerId: ProviderId, prompt: string): Promise<string> {
  const provider = PROVIDERS[providerId]
  if (!provider) throw new Error(`provider ${providerId} não encontrado`)
  return new Promise<string>((resolve, reject) => {
    let buffer = ''
    provider
      .invoke({
        prompt,
        onChunk: (c) => {
          buffer += c
        },
        onDone: () => resolve(buffer),
        onError: (e) => reject(e)
      })
      .catch(reject)
  })
}

async function snapshotPage(page: Page): Promise<PageSnapshot> {
  // Tag interactive elements with data-agent-id and collect summary
  const data = await page.evaluate(() => {
    const interactive = Array.from(
      document.querySelectorAll(
        'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
      )
    )
    const result: Array<Record<string, string | null>> = []
    let id = 0
    interactive.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect()
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight + 200
      if (!visible) return
      const cs = window.getComputedStyle(el as HTMLElement)
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return
      el.setAttribute('data-agent-id', String(id))
      const inputEl = el as HTMLInputElement
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
      result.push({
        id: String(id),
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        text,
        type: inputEl.type ?? null,
        name: inputEl.name ?? null,
        placeholder: (el as HTMLInputElement).placeholder ?? null,
        value: inputEl.value ?? null,
        href: el.getAttribute('href'),
        ariaLabel: el.getAttribute('aria-label')
      })
      id++
    })

    const visibleText = (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 1500)
    return {
      url: window.location.href,
      title: document.title,
      elements: result,
      visibleText
    }
  })

  return {
    url: data.url,
    title: data.title,
    visibleText: data.visibleText,
    elements: data.elements.map((e) => ({
      id: parseInt(e.id ?? '0', 10),
      tag: e.tag ?? '',
      role: e.role ?? null,
      text: e.text ?? '',
      type: e.type ?? null,
      name: e.name ?? null,
      placeholder: e.placeholder ?? null,
      value: e.value ?? null,
      href: e.href ?? null,
      ariaLabel: e.ariaLabel ?? null
    }))
  }
}

function describeElement(e: ElementSummary): string {
  const parts: string[] = [`[${e.id}] ${e.tag}`]
  if (e.role) parts.push(`role=${e.role}`)
  if (e.type) parts.push(`type=${e.type}`)
  if (e.name) parts.push(`name="${e.name}"`)
  if (e.placeholder) parts.push(`placeholder="${e.placeholder}"`)
  if (e.ariaLabel) parts.push(`aria="${e.ariaLabel}"`)
  if (e.value && e.tag === 'input') parts.push(`value="${e.value.slice(0, 40)}"`)
  if (e.href) parts.push(`href="${e.href.slice(0, 60)}"`)
  if (e.text) parts.push(`text="${e.text}"`)
  return parts.join(' ')
}

function buildAgentPrompt(input: {
  goal: string
  intensity: string
  step: number
  maxSteps: number
  snapshot: PageSnapshot
  history: { action: string; detail?: string; ok: boolean; error?: string }[]
}): string {
  const elemList = input.snapshot.elements.map(describeElement).join('\n') || '(nenhum elemento interativo detectado)'
  const histLines = input.history.length
    ? input.history
        .map((h, i) => `${i + 1}. ${h.action}${h.detail ? ' — ' + h.detail : ''} ${h.ok ? '✓' : '✗ ' + (h.error ?? '')}`)
        .join('\n')
    : '(nenhuma ainda)'

  const intensityHint = {
    sane: 'Modo SANE: caminho feliz, sem tentar quebrar.',
    chaos: 'Modo CHAOS: depois do feliz, faça 1-2 ações fora do padrão (input com texto longo/caracteres especiais).',
    nuclear: 'Modo NUCLEAR: tudo do chaos + recarregue a página no meio + clique em algo inesperado pra testar resiliência.'
  }[input.intensity as 'sane' | 'chaos' | 'nuclear']

  return `Você é um agente de teste de UI. Sua missão: cumprir o objetivo do usuário interagindo com a página real.

OBJETIVO DO USUÁRIO:
"""
${input.goal}
"""

${intensityHint}

ESTADO ATUAL (passo ${input.step}/${input.maxSteps}):
URL: ${input.snapshot.url}
Title: ${input.snapshot.title}

Elementos interativos visíveis (use o número [N] como referência):
${elemList}

Texto visível na tela (resumo):
"""
${input.snapshot.visibleText}
"""

Histórico do que você já fez:
${histLines}

DECIDA A PRÓXIMA ÚNICA AÇÃO. Responda APENAS UM objeto JSON entre \`\`\`json e \`\`\`.

Ações disponíveis:
- {"action":"click","ref":N}                   — clica no elemento [N]
- {"action":"fill","ref":N,"value":"texto"}    — preenche input [N]
- {"action":"press","ref":N,"key":"Enter"}     — pressiona tecla em [N]
- {"action":"goto","path":"/sub"}              — navega pra path relativo
- {"action":"wait","ms":800}                   — espera (pra animação carregar)
- {"action":"screenshot","name":"login-ok"}    — registra evidência visual
- {"action":"done","reason":"login completou e dashboard apareceu"}  — objetivo cumprido
- {"action":"fail","reason":"botão login não encontrado"}            — impossível continuar

REGRAS:
- Use SEMPRE "ref":N pros elementos da lista. NUNCA invente seletor CSS.
- Se a tela carregou, tire screenshot ANTES de clicar em algo (evidência do estado).
- Se aparecer modal/popup/erro, registre via screenshot.
- Pare com "done" assim que cumprir o objetivo. Não fique testando além.
- Se o objetivo for "ver a tela" e ela carregou: screenshot + done.
`
}

interface AgentDecision {
  action: 'click' | 'fill' | 'press' | 'goto' | 'wait' | 'screenshot' | 'done' | 'fail'
  ref?: number
  value?: string
  key?: string
  path?: string
  ms?: number
  name?: string
  reason?: string
}

function parseAgentDecision(text: string): AgentDecision | null {
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n?```/)
  const candidate = fence ? fence[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as AgentDecision
    if (typeof parsed?.action !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

async function executeAgentDecision(
  page: Page,
  decision: AgentDecision,
  baseUrl: string,
  shotsDir: string,
  shotIndex: { value: number }
): Promise<{ detail?: string; screenshot?: string }> {
  const refSel = decision.ref != null ? `[data-agent-id="${decision.ref}"]` : null

  switch (decision.action) {
    case 'click': {
      if (!refSel) throw new Error('click sem ref')
      await page.click(refSel, { timeout: 10_000 })
      return { detail: `ref ${decision.ref}` }
    }
    case 'fill': {
      if (!refSel) throw new Error('fill sem ref')
      await page.fill(refSel, decision.value ?? '', { timeout: 10_000 })
      return { detail: `ref ${decision.ref} ← "${decision.value}"` }
    }
    case 'press': {
      if (!refSel) throw new Error('press sem ref')
      await page.press(refSel, decision.key ?? 'Enter', { timeout: 10_000 })
      return { detail: `ref ${decision.ref} ${decision.key}` }
    }
    case 'goto': {
      const target = joinUrl(baseUrl, decision.path)
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      return { detail: `→ ${target}` }
    }
    case 'wait': {
      await page.waitForTimeout(decision.ms ?? 500)
      return { detail: `${decision.ms ?? 500}ms` }
    }
    case 'screenshot': {
      shotIndex.value++
      const safeName = (decision.name ?? 'shot').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40)
      const file = `${String(shotIndex.value).padStart(2, '0')}-${safeName || 'shot'}.png`
      const fullPath = join(shotsDir, file)
      await page.screenshot({ path: fullPath, fullPage: true })
      return { detail: file, screenshot: fullPath }
    }
    case 'done':
    case 'fail':
      return { detail: decision.reason ?? '' }
    default:
      throw new Error(`ação agente desconhecida: ${(decision as { action: string }).action}`)
  }
}

export async function runAgent(opts: AgentRunOptions): Promise<RunResult> {
  const id = timestampedId()
  const folder = join(runsDir(), id)
  await mkdir(folder, { recursive: true })
  const shotsDir = join(folder, 'screenshots')
  await mkdir(shotsDir, { recursive: true })

  const startedAt = Date.now()
  const log: LogEntry[] = []
  const screenshots: string[] = []
  const shotIndex = { value: 0 }
  let error: string | null = null
  let ok = true
  const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS

  let browser: Browser | null = null
  let ctx: BrowserContext | null = null

  const decisionLog: { action: string; detail?: string; ok: boolean; error?: string }[] = []

  try {
    browser = await chromium.launch({ headless: true })
    ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()

    // Initial navigation
    await page.goto(opts.baseUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    log.push({
      index: 0,
      action: 'goto',
      ok: true,
      detail: `→ ${opts.baseUrl}`,
      ts: Date.now()
    })
    decisionLog.push({ action: 'goto', detail: opts.baseUrl, ok: true })
    opts.onEvent?.({
      type: 'action',
      step: 0,
      action: 'goto',
      detail: `→ ${opts.baseUrl}`,
      ok: true
    })

    for (let step = 1; step <= maxSteps; step++) {
      // small wait to let any post-action animations settle
      await page.waitForTimeout(300)

      // snapshot
      const snap = await snapshotPage(page)
      opts.onEvent?.({
        type: 'snapshot',
        step,
        url: snap.url,
        title: snap.title,
        elementsCount: snap.elements.length
      })

      // ask IA
      opts.onEvent?.({ type: 'thinking', step })
      const promptText = buildAgentPrompt({
        goal: opts.goal,
        intensity: opts.intensity,
        step,
        maxSteps,
        snapshot: snap,
        history: decisionLog
      })

      let decision: AgentDecision | null
      try {
        const raw = await callProvider(opts.providerId, promptText)
        decision = parseAgentDecision(raw)
      } catch (e) {
        ok = false
        error = `IA falhou no passo ${step}: ${(e as Error).message}`
        opts.onEvent?.({ type: 'fail', reason: error })
        break
      }

      if (!decision) {
        ok = false
        error = `IA retornou JSON inválido no passo ${step}`
        opts.onEvent?.({ type: 'fail', reason: error })
        break
      }

      if (decision.action === 'done') {
        opts.onEvent?.({ type: 'done', reason: decision.reason ?? 'objetivo cumprido' })
        log.push({
          index: log.length,
          action: 'done',
          ok: true,
          detail: decision.reason,
          ts: Date.now()
        })
        // final screenshot
        try {
          shotIndex.value++
          const file = `${String(shotIndex.value).padStart(2, '0')}-final.png`
          const full = join(shotsDir, file)
          await page.screenshot({ path: full, fullPage: true })
          screenshots.push(full)
        } catch {
          // ignore
        }
        break
      }

      if (decision.action === 'fail') {
        ok = false
        error = decision.reason ?? 'agente desistiu'
        opts.onEvent?.({ type: 'fail', reason: error })
        log.push({
          index: log.length,
          action: 'fail',
          ok: false,
          error,
          ts: Date.now()
        })
        break
      }

      try {
        const r = await executeAgentDecision(page, decision, opts.baseUrl, shotsDir, shotIndex)
        log.push({
          index: log.length,
          action: decision.action,
          ok: true,
          detail: r.detail,
          ts: Date.now()
        })
        decisionLog.push({ action: decision.action, detail: r.detail, ok: true })
        if (r.screenshot) screenshots.push(r.screenshot)
        opts.onEvent?.({
          type: 'action',
          step,
          action: decision.action,
          detail: r.detail,
          ok: true
        })
      } catch (e) {
        const errMsg = (e as Error).message
        log.push({
          index: log.length,
          action: decision.action,
          ok: false,
          error: errMsg,
          ts: Date.now()
        })
        decisionLog.push({ action: decision.action, ok: false, error: errMsg })
        opts.onEvent?.({
          type: 'action',
          step,
          action: decision.action,
          ok: false,
          error: errMsg
        })
        try {
          shotIndex.value++
          const file = `${String(shotIndex.value).padStart(2, '0')}-error.png`
          const full = join(shotsDir, file)
          await page.screenshot({ path: full, fullPage: true })
          screenshots.push(full)
        } catch {
          // ignore
        }
        // Don't abort — let agent recover next step
      }
    }
  } catch (e) {
    ok = false
    error = (e as Error).message
  } finally {
    if (ctx) {
      try {
        await ctx.close()
      } catch {
        // ignore
      }
    }
    if (browser) {
      try {
        await browser.close()
      } catch {
        // ignore
      }
    }
  }

  const result: RunResult = {
    id,
    ok: ok && !error,
    baseUrl: opts.baseUrl,
    prompt: opts.goal,
    intensity: opts.intensity,
    actionsCount: log.length,
    startedAt,
    finishedAt: Date.now(),
    log,
    screenshots,
    videoPath: null,
    error,
    folder
  }
  try {
    await writeFile(join(folder, 'run.json'), JSON.stringify(result, null, 2), 'utf-8')
  } catch {
    // ignore
  }
  return result
}
