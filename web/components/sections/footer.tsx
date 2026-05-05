import { getTranslations } from 'next-intl/server'
import { Github, Twitter, MessageCircle, Mail } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'

export async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="main-footer relative px-6 pt-32 pb-12 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="font-mono text-3xl md:text-5xl font-bold tracking-tight">
              {t('tagline')}
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://github.com/Luccas-carvalho/DevSenses"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('links.github')}
              className="hover:text-foreground transition-colors"
            >
              <Github size={18} />
            </a>
            <a
              href="#"
              aria-label={t('links.twitter')}
              className="hover:text-foreground transition-colors"
            >
              <Twitter size={18} />
            </a>
            <a
              href="#"
              aria-label={t('links.discord')}
              className="hover:text-foreground transition-colors"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="mailto:luccas@devsenses.dev"
              aria-label={t('links.email')}
              className="hover:text-foreground transition-colors"
            >
              <Mail size={18} />
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center md:text-right">
            {t('copyright')}{' '}
            <a
              href="https://www.linkedin.com/in/luccas-carvalhodesenvolvedor"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link text-primary hover:text-primary/80 font-medium"
            >
              Luccas Carvalho
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
