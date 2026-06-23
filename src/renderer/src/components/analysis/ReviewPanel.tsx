import { useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Info,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  FileCode2,
  Copy,
  Check
} from 'lucide-react'
import {
  gradeToLetter,
  SEVERITY_LABEL,
  formatReviewAsPrompt,
  type CodeReview,
  type ReviewSeverity
} from '@shared/codeReview'
import { renderInline } from '@/lib/inlineMarkup'
import CodeBlock from '@/components/analysis/CodeBlock'
import { cn } from '@/lib/utils'

interface Props {
  review: CodeReview | null
  state: 'idle' | 'loading' | 'done' | 'error'
  error?: string
  onRetry?: () => void
}

const SEVERITY: Record<ReviewSeverity, { icon: typeof ShieldAlert; text: string }> = {
  critical: { icon: ShieldAlert, text: 'text-rose-400' },
  medium: { icon: AlertCircle, text: 'text-amber-400' },
  low: { icon: Info, text: 'text-sky-400' }
}

function gradeColor(grade: number): string {
  if (grade >= 8) return 'text-emerald-400'
  if (grade >= 6) return 'text-amber-400'
  return 'text-rose-400'
}

export default function ReviewPanel({ review, state, error, onRetry }: Props): React.ReactElement {
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <p className="text-xs">Revisando o código…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive max-w-md">
          <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
          <span className="break-words">{error || 'Falha ao gerar o review.'}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs rounded-md px-3 h-8 border border-border/50 hover:bg-accent/60 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Tentar de novo
          </button>
        )}
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <ShieldAlert className="size-5 opacity-50" />
        <p className="text-xs text-center px-4">
          Nenhum review ainda. Liga o toggle e clica Explicar.
        </p>
      </div>
    )
  }

  const letter = gradeToLetter(review.grade)
  const tone = gradeColor(review.grade)
  const critical = review.issues.filter((i) => i.severity === 'critical')
  const medium = review.issues.filter((i) => i.severity === 'medium')
  const low = review.issues.filter((i) => i.severity === 'low')
  const ordered = [...critical, ...medium, ...low]

  return (
    <div className="space-y-5 min-w-0">
      {/* ── Nota + contadores ── */}
      <div className="grid grid-cols-[78px_1fr] gap-3 rounded-xl border border-border/60 bg-card/40 p-4 min-w-0">
        <div className="flex flex-col items-center justify-center border-r border-border/50 pr-3 text-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Nota
          </span>
          <span className={cn('mt-1 text-4xl font-bold leading-none tabular-nums', tone)}>
            {review.grade.toFixed(1)}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground">
            / 10 · <span className={cn('font-semibold', tone)}>{letter}</span>
          </span>
        </div>
        <div className="flex flex-col justify-center gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {critical.length > 0 && (
              <Chip icon={ShieldAlert} className="text-rose-400">
                {critical.length} crítico{critical.length !== 1 ? 's' : ''}
              </Chip>
            )}
            {medium.length > 0 && (
              <Chip icon={AlertCircle} className="text-amber-400">
                {medium.length} médio{medium.length !== 1 ? 's' : ''}
              </Chip>
            )}
            {low.length > 0 && (
              <Chip icon={Info} className="text-sky-400">
                {low.length} baixo{low.length !== 1 ? 's' : ''}
              </Chip>
            )}
            {review.issues.length === 0 && (
              <Chip icon={CheckCircle2} className="text-emerald-400">
                Sem problemas
              </Chip>
            )}
            {review.suggestions.length > 0 && (
              <Chip icon={Lightbulb} className="text-primary">
                {review.suggestions.length} sugest{review.suggestions.length !== 1 ? 'ões' : 'ão'}
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* ── Resumo ── */}
      {review.summary && (
        <Section
          icon={Sparkles}
          title="Resumo"
          action={<CopyPromptButton review={review} />}
        >
          <p className="text-[13px] leading-relaxed break-words text-foreground/90">
            {renderInline(review.summary)}
          </p>
        </Section>
      )}

      {/* ── Problemas ── */}
      {ordered.length > 0 && (
        <Section icon={AlertTriangle} title="Problemas" subtitle={String(ordered.length)}>
          <div className="divide-y divide-border/40 rounded-lg border border-border/50 bg-card/20 overflow-hidden">
            {ordered.map((issue, i) => {
              const sev = SEVERITY[issue.severity]
              const Icon = sev.icon
              return (
                <div key={i} className="p-3 space-y-1.5 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon className={cn('size-3.5 flex-shrink-0 mt-0.5', sev.text)} />
                    <span className="flex-1 text-[13px] font-medium leading-snug break-words">
                      {issue.title}
                    </span>
                    <span
                      className={cn(
                        'flex-shrink-0 mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        sev.text
                      )}
                    >
                      {SEVERITY_LABEL[issue.severity]}
                    </span>
                  </div>
                  {issue.file && (
                    <div className="flex items-center gap-1 pl-[22px] text-[10.5px] text-muted-foreground/70 min-w-0">
                      <FileCode2 className="size-3 flex-shrink-0" />
                      <span className="font-mono break-all">
                        {issue.file}
                        {issue.line != null ? `:${issue.line}` : ''}
                      </span>
                    </div>
                  )}
                  <p className="pl-[22px] text-xs text-muted-foreground leading-relaxed break-words">
                    {renderInline(issue.detail)}
                  </p>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Pontos fortes ── */}
      {review.strengths.length > 0 && (
        <Section icon={ThumbsUp} title="Pontos fortes" tone="green">
          <ul className="space-y-1.5">
            {review.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] min-w-0">
                <CheckCircle2 className="mt-0.5 size-3 flex-shrink-0 text-emerald-400" />
                <span className="leading-relaxed break-words text-foreground/85">
                  {renderInline(s)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Sugestões ── */}
      {review.suggestions.length > 0 && (
        <Section icon={Lightbulb} title="Sugestões de melhoria" tone="primary">
          <ul className="space-y-2.5">
            {review.suggestions.map((sug, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] min-w-0">
                <Lightbulb className="mt-0.5 size-3 flex-shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <span className="leading-relaxed break-words text-foreground/85">
                    {renderInline(sug.title)}
                  </span>
                  {sug.example && <CodeBlock code={sug.example} className="mt-1.5" />}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function CopyPromptButton({ review }: { review: CodeReview }): React.ReactElement {
  const [copied, setCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(formatReviewAsPrompt(review))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — silencioso
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copia tudo do review como prompt pra outra IA avaliar e ajustar"
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 h-6 text-[11px] border border-border/50 transition-colors',
        copied ? 'text-emerald-400 border-emerald-400/40' : 'hover:bg-accent/60'
      )}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copiado' : 'Copiar como prompt'}
    </button>
  )
}

function Section({
  icon: Icon,
  title,
  subtitle,
  tone = 'neutral',
  action,
  children
}: {
  icon: typeof Sparkles
  title: string
  subtitle?: string
  tone?: 'neutral' | 'green' | 'primary'
  action?: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  const iconCls =
    tone === 'green'
      ? 'text-emerald-400'
      : tone === 'primary'
        ? 'text-primary'
        : 'text-muted-foreground/70'
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('size-3.5', iconCls)} />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {subtitle && <span className="text-[11px] text-muted-foreground/50">· {subtitle}</span>}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function Chip({
  icon: Icon,
  className,
  children
}: {
  icon: typeof ShieldAlert
  className?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border border-border/60 bg-muted/20 px-2 text-[11px] font-medium whitespace-nowrap',
        className
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
  )
}
