import { getTranslations } from 'next-intl/server'
import { GitBranch, AtSign, MessageCircle, Mail } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
export async function Footer() {
  const t = await getTranslations('footer')
  return (
    <footer className="relative px-6 pt-28 pb-12 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p className="text-center font-bold text-3xl md:text-5xl tracking-tight mb-16">{t('tagline')}</p>
        </FadeIn>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="https://github.com/Luccas-carvalho/DevSenses" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-foreground transition-colors"><GitBranch size={18} /></a>
            <a href="#" aria-label="Twitter/X" className="hover:text-foreground transition-colors"><AtSign size={18} /></a>
            <a href="#" aria-label="Discord" className="hover:text-foreground transition-colors"><MessageCircle size={18} /></a>
            <a href="mailto:luccas@devsenses.dev" aria-label="Email" className="hover:text-foreground transition-colors"><Mail size={18} /></a>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('copyright')}{' '}
            <a href="https://www.linkedin.com/in/luccas-carvalhodesenvolvedor" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium">Luccas Carvalho</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
