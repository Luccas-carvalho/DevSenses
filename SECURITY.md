# Política de Segurança

## Modelo de privacidade (importante)

O DevSenses é **local-first** por design:

- **Teu código nunca vai pra um servidor nosso.** Não existe backend do DevSenses.
- O **diff** só é enviado pro **provider de IA que tu escolheu** (Claude Code,
  Codex, Gemini, Aider ou Ollama) — usando a **tua** chave/credencial (BYOK). No
  caso do Ollama, nem sai da máquina.
- **Telemetria é opt-in e vem DESLIGADA por padrão** (`telemetry_enabled: false`).
  Quando ligada, os eventos ficam num banco **local** (SQLite, tabela
  `telemetry_events`); tu pode ver o resumo e **apagar tudo** em
  Configurações → Privacidade.
- Dados (settings, glossário, mastery, histórico) ficam num **SQLite local** no teu
  device. Nada é sincronizado pra nuvem.

Se tu encontrar qualquer comportamento que contrarie isso, trata como bug de
segurança e reporta (abaixo).

## Versões suportadas

Por ser pré-1.0, o suporte de segurança é só pra **última release**. Sempre atualize
pra a versão mais recente antes de reportar.

## Como reportar uma vulnerabilidade

**Não abra issue pública** pra vulnerabilidade.

1. Preferencial: abre um **GitHub Security Advisory privado** em
   `Security → Report a vulnerability` no repositório
   (https://github.com/Luccas-carvalho/DevSenses/security/advisories/new).
2. Alternativa: contato direto pelo perfil do mantenedor
   (https://github.com/Luccas-carvalho).

Inclua, se possível: versão, SO, provider de IA, passos pra reproduzir e impacto.

## O que esperar

- Confirmação de recebimento em até ~5 dias úteis.
- Avaliação e, se procede, correção numa release de patch.
- Crédito ao reporter no changelog (se quiser).

Por ser um projeto open source mantido por uma pessoa, não há SLA formal nem
programa de bug bounty — mas reports responsáveis são muito bem-vindos.
