export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y border-border bg-card/30 backdrop-blur-sm py-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex gap-12 animate-marquee whitespace-nowrap will-change-transform">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-12 shrink-0">
            <span className="font-mono text-sm uppercase tracking-[0.25em] text-muted-foreground/60">
              {item}
            </span>
            <span className="size-1 rounded-full bg-primary/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
