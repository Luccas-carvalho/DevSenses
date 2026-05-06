export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[120px] opacity-40 animate-aurora"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(262 88% 60% / 0.6) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 animate-aurora"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(280 80% 55% / 0.5) 0%, transparent 65%)',
          animationDelay: '-6s',
        }}
      />
      <div
        className="absolute -bottom-32 right-0 w-[700px] h-[700px] rounded-full blur-[110px] opacity-25 animate-aurora"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(245 90% 65% / 0.5) 0%, transparent 65%)',
          animationDelay: '-12s',
        }}
      />
    </div>
  )
}
