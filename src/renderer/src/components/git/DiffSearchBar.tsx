import { useEffect, useRef } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import Tooltip from '@/components/ui/Tooltip'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  matchCount: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

export default function DiffSearchBar({
  query,
  onQueryChange,
  matchCount,
  currentIndex,
  onPrev,
  onNext,
  onClose
}: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div className="absolute top-2 right-3 z-30 flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-popover shadow-lg">
      <Search className="size-3 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (e.shiftKey) onPrev()
            else onNext()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        placeholder="Buscar no diff…"
        className="w-44 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />
      <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">
        {matchCount === 0 ? '0/0' : `${currentIndex + 1}/${matchCount}`}
      </span>
      <Tooltip label="Match anterior" shortcut="⇧⏎">
        <button
          type="button"
          onClick={onPrev}
          disabled={matchCount === 0}
          className="p-1 rounded hover:bg-accent/60 disabled:opacity-40"
        >
          <ChevronUp className="size-3" />
        </button>
      </Tooltip>
      <Tooltip label="Próximo match" shortcut="⏎">
        <button
          type="button"
          onClick={onNext}
          disabled={matchCount === 0}
          className="p-1 rounded hover:bg-accent/60 disabled:opacity-40"
        >
          <ChevronDown className="size-3" />
        </button>
      </Tooltip>
      <Tooltip label="Fechar busca" shortcut="Esc">
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-accent/60"
        >
          <X className="size-3" />
        </button>
      </Tooltip>
    </div>
  )
}
