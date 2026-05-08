import { useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepoStatus } from '@shared/git'

interface Props {
  path: string
  status: RepoStatus
  onChanged: () => void
}

export default function ConflictResolver({ path, status, onChanged }: Props): React.ReactElement {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const conflicts = useMemo(
    () =>
      status.files.filter(
        (f) => f.staged === 'conflicted' || f.unstaged === 'conflicted'
      ),
    [status.files]
  )

  const allResolved = conflicts.length === 0
  const op = status.isMerging ? 'Merge' : status.isRebasing ? 'Rebase' : 'Op'

  async function markResolved(file: string): Promise<void> {
    setBusy(file)
    setError('')
    const r = await window.api.invoke('git:stageFiles', { path, files: [file] })
    setBusy(null)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      return
    }
    onChanged()
  }

  async function openInEditor(file: string): Promise<void> {
    await window.api.invoke('repository:openInEditor', { path, file })
  }

  async function continueOp(): Promise<void> {
    setBusy('continue')
    setError('')
    const r = status.isMerging
      ? await window.api.invoke('git:continueMerge', { path })
      : { ok: false, error: 'Continue rebase precisa do terminal' }
    setBusy(null)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      return
    }
    onChanged()
  }

  async function abort(): Promise<void> {
    setBusy('abort')
    setError('')
    const r = status.isMerging
      ? await window.api.invoke('git:abortMerge', { path })
      : await window.api.invoke('git:abortRebase', { path })
    setBusy(null)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      return
    }
    onChanged()
  }

  return (
    <div className="h-full flex flex-col bg-amber-500/5">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">{op} em andamento</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {allResolved
              ? 'Todos os conflitos resolvidos. Pode continuar.'
              : `${conflicts.length} arquivo${conflicts.length === 1 ? '' : 's'} com conflito. Resolva editando + marque como resolvido.`}
          </p>
        </div>
        <button
          type="button"
          onClick={continueOp}
          disabled={!allResolved || busy !== null}
          className={cn(
            'h-8 px-3 text-[12px] rounded-md font-medium inline-flex items-center gap-1.5',
            allResolved && busy === null
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {busy === 'continue' && <Loader2 className="size-3 animate-spin" />}
          Continuar {op.toLowerCase()}
        </button>
        <button
          type="button"
          onClick={abort}
          disabled={busy !== null}
          className="h-8 px-3 text-[12px] rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {busy === 'abort' && <Loader2 className="size-3 animate-spin" />}
          Abortar
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-3 p-2 rounded-md text-[11px] text-destructive bg-destructive/10 border border-destructive/30 whitespace-pre-wrap font-mono">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Check className="size-10 text-green-500 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Tudo resolvido</p>
            <p className="text-[11px] text-muted-foreground">
              Clica em "Continuar {op.toLowerCase()}" pra finalizar.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conflicts.map((f) => (
              <li
                key={f.path}
                className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-card/60"
              >
                <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
                <span className="font-mono text-[12px] text-foreground/90 flex-1 truncate">
                  {f.path}
                </span>
                <button
                  type="button"
                  onClick={() => openInEditor(f.path)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border border-border hover:bg-accent/60"
                >
                  <ExternalLink className="size-3" />
                  Abrir no editor
                </button>
                <button
                  type="button"
                  onClick={() => markResolved(f.path)}
                  disabled={busy === f.path}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md bg-green-500/15 border border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/25 disabled:opacity-60"
                >
                  {busy === f.path ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Check className="size-3" />
                  )}
                  Marcar resolvido
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 p-3 rounded-lg border border-border/40 bg-muted/30 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground/80 mb-1">Como resolver</p>
          <ol className="space-y-1 list-decimal pl-4">
            <li>Abre o arquivo no editor (botão acima ou duplo-clique).</li>
            <li>Procura marcadores <code className="bg-muted px-1 rounded font-mono">{'<<<<<<<'}</code>, <code className="bg-muted px-1 rounded font-mono">{'======='}</code>, <code className="bg-muted px-1 rounded font-mono">{'>>>>>>>'}</code>.</li>
            <li>Edita pra deixar só a versão final, removendo os marcadores.</li>
            <li>Salva e clica em "Marcar resolvido".</li>
            <li>Quando todos estiverem resolvidos, clica "Continuar".</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
