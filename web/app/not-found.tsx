import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link href="/" className="text-primary hover:underline">Voltar</Link>
    </main>
  )
}
