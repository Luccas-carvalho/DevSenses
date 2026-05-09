#!/usr/bin/env bash
# DevSenses — captura prints do app pra landing
# Uso: ./scripts/capture-screenshots.sh
# Pra cada nome, o script abre selecao de janela. Clica na janela do DevSenses.

set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/web/public/screenshots"
mkdir -p "$OUT_DIR"

SHOTS=(
  "hero-project|Tela principal: diff + analise + quiz lateral"
  "onboarding-cosmic|Tela do onboarding com fundo galaxia"
  "project-diff|Diff em destaque com explicacao streaming"
  "quiz-mastery|Quiz com indicador de mastery por conceito"
)

echo "DevSenses — captura de prints"
echo "Pra cada um, clica na janela do DevSenses (Cmd+Tab pra alternar)."
echo ""

for entry in "${SHOTS[@]}"; do
  name="${entry%%|*}"
  desc="${entry#*|}"
  echo "==> $name — $desc"
  echo "    Coloca o app no estado certo, aperta ENTER e clica na janela."
  read -r _
  screencapture -W -t png "$OUT_DIR/$name.png"
  echo "    Salvo: $OUT_DIR/$name.png"
  echo ""
done

echo "Pronto. Conferir em: $OUT_DIR"
