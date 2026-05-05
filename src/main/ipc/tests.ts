import { ipcMain, shell, BrowserWindow } from 'electron'
import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import {
  runTest,
  runAgent,
  listRuns as listRunsFn,
  deleteRun as deleteRunFn,
  type TestAction,
  type RunResult
} from '../tests/runner'
import type { ProviderId } from '@shared/providers'
import { runsDir } from '../utils/paths'
import type { IpcContract } from '@shared/ipc-contract'

interface RunSummary {
  id: string
  ok: boolean
  baseUrl: string
  prompt: string | null
  intensity: string
  actionsCount: number
  startedAt: number
  finishedAt: number
  screenshotCount: number
  hasVideo: boolean
  folder: string
  error: string | null
}

async function detectUrlFromWorkspace(
  path: string
): Promise<{ suggested: string | null; scripts: Record<string, string> }> {
  try {
    const pkgPath = join(path, 'package.json')
    const raw = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }
    const scripts = pkg.scripts ?? {}

    const candidate = scripts.dev ?? scripts.start ?? scripts.serve ?? ''
    const portMatch = candidate.match(/(?:--port[=\s]|-p[=\s]|PORT=)(\d{2,5})/)
    let port: number | null = portMatch ? parseInt(portMatch[1], 10) : null

    if (!port) {
      // Heuristics by framework
      if (/vite/.test(candidate)) port = 5173
      else if (/next/.test(candidate)) port = 3000
      else if (/react-scripts/.test(candidate)) port = 3000
      else if (/astro/.test(candidate)) port = 4321
      else if (/svelte|sveltekit/.test(candidate)) port = 5173
      else if (/(http-server|serve)/.test(candidate)) port = 8080
      else if (/(express|fastify|koa|nest)/.test(candidate)) port = 3000
    }

    return {
      suggested: port ? `http://localhost:${port}` : null,
      scripts
    }
  } catch {
    return { suggested: null, scripts: {} }
  }
}

async function readRunMeta(folder: string): Promise<RunSummary | null> {
  try {
    const raw = await readFile(join(folder, 'run.json'), 'utf-8')
    const r = JSON.parse(raw) as RunResult
    return {
      id: r.id,
      ok: r.ok,
      baseUrl: r.baseUrl,
      prompt: r.prompt,
      intensity: r.intensity,
      actionsCount: r.actionsCount,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      screenshotCount: r.screenshots.length,
      hasVideo: !!r.videoPath,
      folder: r.folder,
      error: r.error
    }
  } catch {
    return null
  }
}

export function registerTestsHandlers(): void {
  ipcMain.handle('tests:detectUrl', (_, payload: IpcContract['tests:detectUrl']['request']) => {
    return detectUrlFromWorkspace(payload.path)
  })

  ipcMain.handle(
    'tests:agentRun',
    async (event, payload: IpcContract['tests:agentRun']['request']) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      const result = await runAgent({
        baseUrl: payload.baseUrl,
        goal: payload.goal,
        intensity: payload.intensity,
        providerId: payload.providerId as ProviderId,
        maxSteps: payload.maxSteps,
        onEvent: (ev) => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('tests:agentEvent', { runId: payload.runId ?? '', ...ev })
          }
        }
      })
      return result
    }
  )

  ipcMain.handle('tests:run', async (_, payload: IpcContract['tests:run']['request']) => {
    const result = await runTest({
      baseUrl: payload.baseUrl,
      actions: payload.actions as TestAction[],
      prompt: payload.prompt,
      intensity: payload.intensity,
      recordVideo: payload.recordVideo
    })
    // persist metadata
    try {
      await writeFile(join(result.folder, 'run.json'), JSON.stringify(result, null, 2), 'utf-8')
    } catch {
      // ignore
    }
    return result
  })

  ipcMain.handle('tests:listRuns', async () => {
    const dirs = await listRunsFn()
    const out: RunSummary[] = []
    for (const d of dirs) {
      const meta = await readRunMeta(d.folder)
      if (meta) {
        out.push(meta)
        continue
      }
      // fallback when run.json missing — read screenshots count
      try {
        const shotsDir = join(d.folder, 'screenshots')
        const files = await readdir(shotsDir)
        out.push({
          id: d.id,
          ok: true,
          baseUrl: '',
          prompt: null,
          intensity: 'sane',
          actionsCount: 0,
          startedAt: d.mtime,
          finishedAt: d.mtime,
          screenshotCount: files.filter((f) => f.endsWith('.png')).length,
          hasVideo: false,
          folder: d.folder,
          error: null
        })
      } catch {
        // ignore
      }
    }
    return out
  })

  ipcMain.handle('tests:loadRun', async (_, payload: IpcContract['tests:loadRun']['request']) => {
    const folder = join(runsDir(), payload.id)
    try {
      const raw = await readFile(join(folder, 'run.json'), 'utf-8')
      return JSON.parse(raw) as RunResult
    } catch {
      // build a best-effort result without metadata
      const shotsDir = join(folder, 'screenshots')
      const screenshots: string[] = []
      try {
        const files = await readdir(shotsDir)
        for (const f of files.sort()) {
          if (f.endsWith('.png')) screenshots.push(join(shotsDir, f))
        }
      } catch {
        // ignore
      }
      const s = await stat(folder).catch(() => null)
      return {
        id: payload.id,
        ok: true,
        baseUrl: '',
        prompt: null,
        intensity: 'sane',
        actionsCount: 0,
        startedAt: s?.mtimeMs ?? 0,
        finishedAt: s?.mtimeMs ?? 0,
        log: [],
        screenshots,
        videoPath: null,
        error: null,
        folder
      } as RunResult
    }
  })

  ipcMain.handle('tests:openFolder', (_, payload: IpcContract['tests:openFolder']['request']) => {
    return shell.openPath(payload.path)
  })

  ipcMain.handle('tests:deleteRun', async (_, payload: IpcContract['tests:deleteRun']['request']) => {
    await deleteRunFn(payload.id)
  })

  ipcMain.handle('tests:readImage', async (_, payload: IpcContract['tests:readImage']['request']) => {
    const data = await readFile(payload.path)
    const ext = basename(payload.path).split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return `data:${mime};base64,${data.toString('base64')}`
  })
}
