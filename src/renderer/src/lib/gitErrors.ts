/**
 * Traduz erros crus do git (checkout/troca de branch) em mensagens
 * curtas e claras em PT-BR pro usuário entender o que fazer.
 */

/** Extrai a lista de arquivos citados por um erro de checkout. */
function extractFiles(raw: string): string[] {
  const lines = raw.split('\n')
  const files: string[] = []
  let collecting = false

  for (const line of lines) {
    const trimmed = line.trim()
    // Git lista os arquivos entre a frase "...would be overwritten by checkout:"
    // e a frase final "Please commit your changes...".
    if (/would be overwritten by checkout:?$/i.test(trimmed)) {
      collecting = true
      continue
    }
    if (collecting) {
      if (!trimmed || /^(please|aborting|error:)/i.test(trimmed)) break
      files.push(trimmed)
    }
  }
  return files
}

/**
 * Recebe o stderr cru de uma falha ao trocar de branch e devolve uma
 * mensagem amigável. Se não reconhecer o erro, devolve o texto original.
 */
export function humanizeCheckoutError(raw: string | undefined, target?: string): string {
  const text = (raw ?? '').trim()
  if (!text) return 'Não foi possível trocar de branch. Erro desconhecido.'

  const destino = target ? ` "${target}"` : ''

  // Caso 1: alterações locais não salvas seriam sobrescritas
  if (/would be overwritten by checkout/i.test(text)) {
    const files = extractFiles(text)
    const lista =
      files.length > 0 ? '\n\nArquivos:\n' + files.map((f) => `  • ${f}`).join('\n') : ''
    const quantos =
      files.length === 1 ? '1 arquivo' : files.length > 1 ? `${files.length} arquivos` : 'arquivos'

    return (
      `Você tem alterações não salvas em ${quantos}. ` +
      `Faça commit ou guarde (stash) antes de trocar pra branch${destino}.` +
      lista
    )
  }

  // Caso 2: conflito de merge pendente impede a troca
  if (/you need to resolve your current index first/i.test(text)) {
    return 'Tem um conflito de merge pendente. Resolva ou cancele o merge antes de trocar de branch.'
  }

  // Caso 3: branch não existe
  if (/did not match any file\(s\) known to git|pathspec .* did not match/i.test(text)) {
    return `A branch${destino} não existe nesse repositório.`
  }

  // Fallback: mostra o erro cru
  return text
}
