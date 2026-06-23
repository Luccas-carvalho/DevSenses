import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  PROVIDER_IDS,
  DEFAULT_PROVIDER_MODELS,
  type ProviderId,
  type ModelOption
} from '@shared/providers'
import { dataDir } from '../utils/paths'
import { findBinary } from './detect'

type ModelsMap = Record<ProviderId, ModelOption[]>

function configPath(): string {
  return join(dataDir(), 'models.json')
}

function isModelOption(v: unknown): v is ModelOption {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as ModelOption).id === 'string' &&
    typeof (v as ModelOption).label === 'string'
  )
}

/**
 * Lê o models.json local. Na primeira vez (ou se estiver corrompido) semeia
 * com os defaults e grava — assim o usuário tem um arquivo pronto pra editar
 * sem precisar recompilar o app.
 */
function readConfig(): ModelsMap {
  const path = configPath()
  if (existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Partial<Record<string, unknown>>
      const out = {} as ModelsMap
      for (const id of PROVIDER_IDS) {
        const list = parsed[id]
        out[id] =
          Array.isArray(list) && list.every(isModelOption)
            ? (list as ModelOption[])
            : DEFAULT_PROVIDER_MODELS[id]
      }
      return out
    } catch {
      // arquivo corrompido — cai pro seed abaixo
    }
  }
  const seed = { ...DEFAULT_PROVIDER_MODELS }
  try {
    writeFileSync(path, JSON.stringify(seed, null, 2), 'utf-8')
  } catch {
    // disco cheio / somente-leitura — segue só em memória
  }
  return seed
}

/**
 * `ollama list` é não-interativo e lista os modelos REALMENTE instalados na
 * máquina. Primeira coluna = nome (ex: `gpt-oss:20b`). É a fonte mais fiel pro
 * Ollama, então sobrepõe o config quando responde.
 */
function listOllamaModels(): ModelOption[] | null {
  const bin = findBinary('ollama')
  if (!bin) return null
  const res = spawnSync(bin, ['list'], { encoding: 'utf-8', timeout: 5_000 })
  if (res.status !== 0 || !res.stdout) return null

  const lines = res.stdout.trim().split(/\r?\n/)
  const models: ModelOption[] = []
  for (const line of lines) {
    const name = line.split(/\s+/)[0]?.trim()
    if (!name || name.toUpperCase() === 'NAME') continue
    models.push({ id: name, label: name })
  }
  return models.length ? models : null
}

/**
 * Modelos por provider. Camadas (mais forte primeiro):
 *   1. CLI não-interativo (hoje: `ollama list`)
 *   2. models.json local editável
 *   3. defaults hardcoded (fallback do readConfig)
 *
 * claude/codex/gemini só listam via `/model` interativo (TUI), que não dá pra
 * ler por spawn — esses ficam no models.json.
 */
export function listModels(): ModelsMap {
  const config = readConfig()

  try {
    const ollama = listOllamaModels()
    if (ollama) config.ollama = ollama
  } catch {
    // mantém o config se o ollama falhar
  }

  return config
}
