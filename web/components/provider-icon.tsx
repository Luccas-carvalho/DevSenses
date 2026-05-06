import { cn } from '@/lib/utils'

const ICON_FILE: Record<string, string> = {
  Claude: '/icons/claude.svg',
  Codex: '/icons/codex.svg',
  Gemini: '/icons/gemini.svg',
  Ollama: '/icons/ollama.svg',
}

export function ProviderIcon({ name, className }: { name: string; className?: string }) {
  if (name === 'Aider') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center font-mono font-black text-current leading-none',
          className
        )}
      >
        a
      </span>
    )
  }
  const url = ICON_FILE[name]
  if (!url) return null
  return (
    <span
      aria-hidden
      className={cn('inline-block bg-current', className)}
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}
