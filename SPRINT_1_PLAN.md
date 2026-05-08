# Sprint 1 — Plano técnico

> Loop educacional core: explicar → testar → reforçar

Stack atual: Electron + React 19 · TS · better-sqlite3 · Zustand · provider registry (Claude/Codex/Gemini/Aider/Ollama).

Tabelas relevantes existentes:
- `analyses (id, project_path, project_name, branch, diff_mode, files_count, additions, deletions, diff, analysis, provider_id, seniority, professor_turbo, title, created_at)`
- `concepts (id, name, category, language, framework)`
- `user_seen_concepts (concept_id, first_seen_at, times_seen, marked_learned)`

---

## S1.1 — Quiz pós-explicação (1 dia · P0)

### Objetivo
Após cada análise concluída, IA gera 2-3 perguntas múltipla-escolha. Usuário responde, feedback imediato, persiste resultado.

### Schema novo
**Migration `005_quizzes.sql`**:
```sql
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,        -- JSON array string[4]
  correct_idx INTEGER NOT NULL,
  explain_correct TEXT NOT NULL,
  explain_wrong TEXT NOT NULL,
  user_answer_idx INTEGER,           -- null = não respondeu
  answered_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quizzes_analysis_idx
  ON quizzes (analysis_id, created_at);
```

### Backend

**`src/main/repositories/quizzes.ts`** (novo):
- `insertQuiz(row)`, `updateAnswer(id, idx)`, `byAnalysis(analysisId)`

**`src/main/ai/quiz-generator.ts`** (novo):
- `generateQuiz({ analysisText, diff, seniority, providerId, model }): Promise<QuizDraft[]>`
- Reusa provider registry existente
- Prompt:
  ```
  Você é tutor. Acabou de explicar este diff:
  ---
  {analysisText}
  ---
  Gere {N} perguntas múltipla-escolha que testam o conceito MAIS central da explicação.
  Adapta dificuldade pra nível: {seniority}.
  Output JSON estrito:
  [{ "question": "...", "options": ["a","b","c","d"], "correctIdx": 0,
     "explainCorrect": "...", "explainWrong": "..." }]
  N=2 se análise curta, N=3 se longa.
  ```
- Parse com `safeJsonExtract` (regex bloco JSON)

**`src/main/ipc/quizzes.ts`** (novo):
- `quiz:generate({ analysisId }) → Quiz[]`
- `quiz:answer({ quizId, idx }) → { correct: bool, explain: string }`
- `quiz:byAnalysis({ analysisId }) → Quiz[]`

**`src/shared/ipc-contract.ts`**: adicionar 3 entries acima.

### Frontend

**`src/renderer/src/components/analysis/Quiz.tsx`** (novo):
- Props: `analysisId: number`
- Carrega/gera quiz no mount
- Estados: `loading | ready | answering | done`
- Cada pergunta = card expansível com 4 botões opção
- Após responder: badge ✓/✗ + texto explain
- Footer: progresso "2/3 corretas"

**Integração**: em `src/renderer/src/pages/Project/index.tsx`, abaixo da seção Análise IA, renderizar `<Quiz analysisId={currentAnalysisId} />` quando `analysisState === 'done'`.

### Testes manuais
- Diff pequeno (1 arquivo) → 2 perguntas
- Diff grande → 3 perguntas
- Resposta correta/errada mostra feedback distinto
- Recarregar Project → quiz persiste com respostas anteriores

---

## S1.2 — Slider profundidade 1-5 (3h · P0)

### Objetivo
Usuário ajusta nível de explicação ao vivo. Reanaliza com novo prompt.

### Settings
**`src/shared/settings.ts`**:
```ts
explanation_depth: 1 | 2 | 3 | 4 | 5  // default 3
```
Adicionar ao map + defaults. (Substitui `professor_turbo` boolean? Ou coexiste? Recomendo **substituir** — turbo vira nivel 5).

### Backend

**`src/main/ai/explain.ts`** (existente, ajustar):
- Substituir lógica `professor_turbo ? promptTurbo : promptNormal` por switch:
  ```ts
  const DEPTH_PROMPTS = {
    1: 'Explica como pra criança de 10 anos. Use analogias do cotidiano. Zero jargão.',
    2: 'Explica pra dev iniciante (1° ano). Conceitos básicos, exemplos simples.',
    3: 'Explica pra dev junior (1-3 anos). Pode usar termos técnicos comuns. Mostre trade-offs leves.',
    4: 'Explica pra dev senior. Vai fundo em padrões, edge cases, performance.',
    5: 'Explica pra especialista. Trade-offs algorítmicos, big-O, comparações de approaches alternativos.'
  }
  ```

### Frontend

**`src/renderer/src/components/analysis/DepthSlider.tsx`** (novo):
- Slider horizontal 1-5 com labels: ELI5 · Iniciante · Junior · Senior · Especialista
- Tooltip explicando cada nível
- Persiste em settings on change
- Emite `onChange` → trigger re-análise

**Integração**: header da seção Análise IA em Project page, ao lado do botão "Explicar".

### Migrate
Manter `professor_turbo` como deprecated por 1 release. Hidratar `explanation_depth = professor_turbo ? 5 : 3` na primeira boot.

---

## S1.3 — Personas dropdown (2h · P1)

### Objetivo
Tom da explicação muda conforme persona escolhida.

### Settings
```ts
explanation_persona: 'default' | 'sarcastic' | 'pragmatic' | 'academic' | 'mentor'  // default 'default'
```

### Backend

**`src/shared/personas.ts`** (novo):
```ts
export const PERSONAS = {
  default:   { label: 'Padrão',     prefix: '' },
  sarcastic: { label: 'Sarcástico', prefix: 'Tom: sarcástico mas educativo. Provoca o user de leve, sem zoeira gratuita.' },
  pragmatic: { label: 'Pragmático', prefix: 'Tom: direto ao ponto. Zero rodeio. Foca no que funciona, não em teoria.' },
  academic:  { label: 'Acadêmico',  prefix: 'Tom: rigoroso. Cite paradigmas, padrões formais, complexity analysis quando relevante.' },
  mentor:    { label: 'Mentor amigo', prefix: 'Tom: caloroso, encorajador. Trata erros como oportunidades. Use "tu" e analogias.' }
}
```

**`src/main/ai/explain.ts`**: prepend `PERSONAS[persona].prefix` ao system prompt.

### Frontend

**`src/renderer/src/components/analysis/PersonaPicker.tsx`** (novo):
- Dropdown shadcn-like com label + selected
- Persist em settings

**Integração**: header análise, ao lado do DepthSlider.

---

## S1.4 — Term-link clicável (4h · P0)

### Objetivo
Termos técnicos na markdown da análise viram links. Click abre popover com definição expandida + botão "Explicar mais a fundo".

### Schema
Reusar `concepts` + `user_seen_concepts` existentes. Adicionar coluna:
**Migration `006_concepts_definition.sql`**:
```sql
ALTER TABLE concepts ADD COLUMN definition TEXT;
ALTER TABLE concepts ADD COLUMN updated_at INTEGER;
```

### Backend

**`src/main/ai/term-explain.ts`** (novo):
- `explainTerm({ term, contextSnippet, seniority }): Promise<{ definition: string; example: string }>`
- Prompt curto:
  ```
  Defina o termo técnico "{term}" em 2-3 frases pra dev nível {seniority}.
  Contexto onde apareceu: ```{contextSnippet}```
  Output JSON: { "definition": "...", "example": "código curto demonstrando" }
  ```

**`src/main/ipc/concepts.ts`** (existe, adicionar):
- `concepts:explainTerm({ term, contextSnippet }) → ConceptDef`
- `concepts:upsertDefinition({ name, definition }) → void`
- `concepts:getDefinition({ name }) → ConceptDef | null`

### Frontend

**`src/renderer/src/lib/term-detector.ts`** (novo):
- Pós-process do markdown render: regex/AST passa por palavras tipo `useState`, `useMemo`, `Promise`, `closure`, etc.
- Lista hardcoded de ~200 termos comuns JS/TS/React/Python (depois IA pode sugerir mais).
- Wrap match em `<TermLink term="..." context="..." />`.

**`src/renderer/src/components/analysis/TermLink.tsx`** (novo):
- Inline span clicável com underline pontilhado primary
- Click → popover (Radix-like, já temos util) com:
  - Definição (cache se já existe, gera se não)
  - Exemplo
  - Botão "Explicar mais a fundo" → expande análise dedicada inline
  - Botão "Salvar no glossário" → marca `marked_learned=0`, força save com `definition`

**Integração**: ajustar Markdown renderer existente da análise pra rodar term-detector pós-render.

### UX detalhes
- Hover: tooltip com 1-line preview
- Click: popover full
- Cmd+click: abre em painel novo (futuro)
- Termo já aprendido (`marked_learned=1`): underline some, link permanece em hover

---

## Ordem de execução sugerida

1. **S1.2 Slider** (3h) — fastest, cria base pro depth nas próximas tasks
2. **S1.3 Personas** (2h) — composa com slider, mesmo padrão de settings
3. **S1.1 Quiz** (1d) — feature mais visível, valida loop educacional
4. **S1.4 Term-link** (4h) — depende de markdown render maduro

**Total**: ~3 dias úteis. Margem segura: **6 dias**.

---

## Riscos / decisões pendentes

- **Quiz cache vs regen**: gerar quiz toda vez que abre análise antiga = caro (API). Salvar uma vez no DB e reusar. Botão "novo quiz" gera adicional.
- **Persona × Depth**: combinam? Sim, prompt = `persona.prefix + depth.prompt + system`. Testar pra não conflitar.
- **Term-link false positives**: lista hardcoded errará em palavras comuns ("state" sem ser React state). Mitigação: regex word boundary + checagem de proximidade com keywords React/JS no parágrafo.
- **Provider compat**: gerador de quiz precisa output JSON. Ollama/Aider podem variar. Validar com `safeJsonExtract` + retry uma vez se falhar.

---

## Arquivos novos previstos

```
src/main/db/migrations/005_quizzes.sql
src/main/db/migrations/006_concepts_definition.sql
src/main/repositories/quizzes.ts
src/main/ai/quiz-generator.ts
src/main/ai/term-explain.ts
src/main/ipc/quizzes.ts
src/shared/personas.ts
src/renderer/src/components/analysis/Quiz.tsx
src/renderer/src/components/analysis/DepthSlider.tsx
src/renderer/src/components/analysis/PersonaPicker.tsx
src/renderer/src/components/analysis/TermLink.tsx
src/renderer/src/lib/term-detector.ts
```

## Arquivos modificados previstos

```
src/shared/settings.ts                   (+depth, +persona)
src/shared/ipc-contract.ts               (+quiz:* +concepts:explainTerm)
src/main/ai/explain.ts                   (depth+persona injection)
src/main/ipc/concepts.ts                 (+explainTerm, +definitions)
src/main/ipc/index.ts                    (register quizzes IPC)
src/renderer/src/pages/Project/index.tsx (mount Quiz, DepthSlider, PersonaPicker)
```
