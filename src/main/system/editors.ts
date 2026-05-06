import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import type { DetectedEditor, DetectedTerminal } from '@shared/git'

const execFileP = promisify(execFile)

interface EditorCandidate {
  id: DetectedEditor['id']
  label: string
  bins: string[]
  cliArgs?: (file: string, line?: number) => string[]
}

const CANDIDATES: EditorCandidate[] = [
  {
    id: 'cursor',
    label: 'Cursor',
    bins: ['cursor', '/Applications/Cursor.app/Contents/Resources/app/bin/cursor'],
    cliArgs: (file, line) => (line ? ['-g', `${file}:${line}`] : [file])
  },
  {
    id: 'vscode',
    label: 'VS Code',
    bins: ['code', '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'],
    cliArgs: (file, line) => (line ? ['-g', `${file}:${line}`] : [file])
  },
  {
    id: 'sublime',
    label: 'Sublime Text',
    bins: ['subl', '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl'],
    cliArgs: (file, line) => [line ? `${file}:${line}` : file]
  },
  {
    id: 'webstorm',
    label: 'WebStorm',
    bins: ['webstorm', '/Applications/WebStorm.app/Contents/MacOS/webstorm'],
    cliArgs: (file, line) => (line ? ['--line', String(line), file] : [file])
  },
  {
    id: 'intellij',
    label: 'IntelliJ IDEA',
    bins: ['idea', '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea'],
    cliArgs: (file, line) => (line ? ['--line', String(line), file] : [file])
  },
  {
    id: 'zed',
    label: 'Zed',
    bins: ['zed', '/Applications/Zed.app/Contents/MacOS/cli'],
    cliArgs: (file, line) => (line ? [`${file}:${line}`] : [file])
  }
]

async function which(cmd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileP('which', [cmd], { encoding: 'utf8' })
    const path = stdout.trim()
    return path || null
  } catch {
    return null
  }
}

export async function detectEditors(): Promise<DetectedEditor[]> {
  const results: DetectedEditor[] = []
  for (const c of CANDIDATES) {
    let found: string | null = null
    for (const b of c.bins) {
      if (b.startsWith('/')) {
        if (existsSync(b)) {
          found = b
          break
        }
      } else {
        const w = await which(b)
        if (w) {
          found = w
          break
        }
      }
    }
    if (found) results.push({ id: c.id, label: c.label, bin: found })
  }
  return results
}

export async function openInEditor(
  repoPath: string,
  opts: { file?: string; line?: number; editorId?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  const editors = await detectEditors()
  if (editors.length === 0) return { ok: false, error: 'Nenhum editor detectado' }
  const chosen: DetectedEditor =
    editors.find((e) => e.id === opts.editorId) ?? editors[0]
  const candidate = CANDIDATES.find((c) => c.id === chosen.id)!
  const target = opts.file ? `${repoPath}/${opts.file}` : repoPath
  const args = candidate.cliArgs ? candidate.cliArgs(target, opts.line) : [target]
  try {
    spawn(chosen.bin, args, { detached: true, stdio: 'ignore' }).unref()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

const TERMINAL_LIST: { id: DetectedTerminal['id']; label: string; appName: string }[] = [
  { id: 'iterm', label: 'iTerm', appName: 'iTerm' },
  { id: 'warp', label: 'Warp', appName: 'Warp' },
  { id: 'ghostty', label: 'Ghostty', appName: 'Ghostty' },
  { id: 'terminal', label: 'Terminal', appName: 'Terminal' }
]

export async function detectTerminals(): Promise<DetectedTerminal[]> {
  const results: DetectedTerminal[] = []
  for (const t of TERMINAL_LIST) {
    if (existsSync(`/Applications/${t.appName}.app`)) {
      results.push({ id: t.id, label: t.label })
    }
  }
  if (results.length === 0) results.push({ id: 'terminal', label: 'Terminal' })
  return results
}

export async function openInTerminal(
  repoPath: string,
  terminalId?: string
): Promise<{ ok: boolean; error?: string }> {
  const list = await detectTerminals()
  const chosen = list.find((t) => t.id === terminalId) ?? list[0]
  const meta = TERMINAL_LIST.find((t) => t.id === chosen.id)!
  try {
    if (meta.id === 'iterm') {
      const script = `tell application "iTerm"
  activate
  if (count of windows) = 0 then
    create window with default profile
  end if
  tell current window
    tell current session
      write text "cd ${repoPath.replace(/"/g, '\\"')}"
    end tell
  end tell
end tell`
      spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' }).unref()
    } else {
      spawn('open', ['-a', meta.appName, repoPath], { detached: true, stdio: 'ignore' }).unref()
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
