import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Download, Rocket, RotateCw } from 'lucide-react'
import type { UpdateInfo } from '@shared/ipc-contract'

const DISMISS_PREFIX = 'devsenses:update-dismissed:'
const RECHECK_MS = 6 * 60 * 60 * 1000

type Phase = 'idle' | 'downloading' | 'done' | 'failed' | 'restart'

/**
 * Modal de atualização (substitui o diálogo nativo). Boot-check via GitHub Releases:
 * baixa o instalador DENTRO do app com barra de progresso e abre no fim. No macOS sem
 * assinatura é instalação manual (arrastar pra Applications); no Win/Linux o
 * electron-updater já baixou em background → mostra o estado "Reiniciar agora".
 */
export function UpdateModal(): React.JSX.Element | null {
  const [data, setData] = useState<UpdateInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [percent, setPercent] = useState(0)

  // Check ao montar + a cada 6h.
  useEffect(() => {
    let alive = true
    const check = (): void => {
      window.api
        .invoke('update:check', undefined)
        .then((r) => {
          if (alive) setData(r)
        })
        .catch(() => undefined)
    }
    check()
    const id = setInterval(check, RECHECK_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // Progresso do download in-app (mac/manual).
  useEffect(() => {
    return window.api.on('update:downloadProgress', (p) => {
      if (p.failed) {
        setPhase('failed')
        return
      }
      setPercent(p.percent)
      if (p.done) setPhase('done')
    })
  }, [])

  // Win/Linux: electron-updater baixou em background → oferece reiniciar.
  useEffect(() => {
    return window.api.on('updater:event', (e) => {
      if (e.type === 'downloaded') setPhase('restart')
    })
  }, [])

  const version = data?.latestVersion ?? null
  const persistedDismiss =
    version != null && localStorage.getItem(DISMISS_PREFIX + version) === '1'
  const show =
    phase === 'restart' || (Boolean(data?.hasUpdate) && !dismissed && !persistedDismiss)

  const dismiss = (): void => {
    if (version) localStorage.setItem(DISMISS_PREFIX + version, '1')
    setDismissed(true)
  }

  const startUpdate = (): void => {
    const url = data?.url
    if (!url) return
    setPhase('downloading')
    setPercent(0)
    void window.api.invoke('update:download', { url })
  }

  const restart = (): void => {
    void window.api.invoke('update:quitAndInstall', undefined)
  }

  const onPrimary = (): void => {
    if (phase === 'restart') restart()
    else if (phase === 'done') dismiss()
    else startUpdate()
  }

  const busy = phase === 'downloading'
  const bullets = [
    'Mais rápido e estável no dia a dia',
    'Correções e melhorias de qualidade',
    'Novos recursos e ajustes de design'
  ]

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="update-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2147483000] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
        >
          <motion.div
            key="update-card"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/50"
          >
            {/* Header cósmico com foguete (gradiente, sem asset) */}
            <div className="relative h-[150px] w-full overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 100% at 50% 0%, #2a1d5e 0%, #1a1342 45%, #0f0a26 100%)'
                }}
              />
              {/* estrelinhas */}
              {[
                [18, 30],
                [70, 22],
                [85, 55],
                [32, 64],
                [55, 38],
                [12, 70]
              ].map(([x, y], i) => (
                <span
                  key={i}
                  className="absolute size-[3px] rounded-full bg-white/70"
                  style={{ left: `${x}%`, top: `${y}%`, opacity: 0.4 + (i % 3) * 0.2 }}
                />
              ))}
              <motion.div
                initial={{ y: 6 }}
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 grid place-items-center"
              >
                <div className="grid size-16 place-items-center rounded-2xl bg-white/10 shadow-[0_0_40px_rgba(124,92,255,0.55)] ring-1 ring-white/20 backdrop-blur-sm">
                  <Rocket className="size-8 text-white" />
                </div>
              </motion.div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-popover to-transparent" />
            </div>

            <div className="-mt-2 px-6 pb-6">
              <h2 className="text-center text-[19px] font-bold tracking-tight text-foreground">
                {phase === 'restart' ? 'Atualização pronta' : 'Atualização disponível'}
                {version ? <span className="text-muted-foreground"> · {version}</span> : null}
              </h2>
              <p className="mx-auto mt-1.5 max-w-[300px] text-center text-[13px] leading-snug text-muted-foreground">
                {phase === 'restart'
                  ? 'Uma nova versão foi baixada. Reinicie pra aplicar.'
                  : 'Pra uma experiência melhor, mais rápida e segura, instale a última versão.'}
              </p>

              {phase !== 'restart' && (
                <ul className="mx-auto mt-4 max-w-[300px] space-y-1.5">
                  {bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground"
                    >
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {(phase === 'downloading' || phase === 'done') && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px] font-medium text-muted-foreground">
                    <span>
                      {phase === 'done'
                        ? 'Instalador aberto — arraste pra Aplicativos e reabra'
                        : 'Baixando…'}
                    </span>
                    <span className="tabular-nums">{percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPrimary}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(124,92,255,0.35)] transition-opacity hover:opacity-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(to right, #7c5cff, #3b82f6)' }}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Baixando…
                    </>
                  ) : phase === 'restart' ? (
                    <>
                      <RotateCw className="size-4" />
                      Reiniciar agora
                    </>
                  ) : phase === 'done' ? (
                    'Fechar'
                  ) : (
                    <>
                      <Download className="size-4" />
                      {phase === 'failed' ? 'Tentar de novo' : 'Atualizar agora'}
                    </>
                  )}
                </button>
                {phase !== 'done' && phase !== 'restart' && (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="h-11 w-full rounded-xl border border-primary/30 text-[14px] font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Lembrar depois
                  </button>
                )}
              </div>

              {phase === 'failed' && (
                <p className="mt-2 text-center text-[11.5px] text-red-400">
                  Não deu pra baixar. Tente de novo.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
