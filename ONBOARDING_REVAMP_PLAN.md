# Onboarding Revamp — Port do Orkestral

> Aplicar polish do onboarding do orkestral no DevSenses + adicionar a cosmic transition ao concluir → home.

---

## Estado atual (DevSenses)

`src/renderer/src/pages/Onboarding/`
- `Shell.tsx` — wrapper com header/footer/nav
- `onboarding.css` — estilos
- `index.tsx` — orquestração de steps + state
- `steps/` — Welcome, Workspace, ProviderDetect, ProviderTest, ModelSelect, Name, Seniority, SeniorityQuiz, Theme, Summary

Problemas:
- Animações entre steps OK, mas sem stagger nas listas
- Sem transição "wow" ao finalizar (vai direto pra home)
- Mockups dos steps menos vivos que orkestral
- Falta polish em microinterações (botões, focus states)

---

## Estado de referência (Orkestral)

`/Users/luccas/Documents/Github/orkestral/src/renderer/src/`
- `components/onboarding/Onboarding.tsx` (208 LoC)
- `components/onboarding/onboarding.css` (762 LoC)
- `components/onboarding/steps/` — StepWelcome, StepFlowBuilder, StepConnectLLM, StepAgents, StepPrivacy, StepProfile, StepReady
- `styles/cosmic-transition.css` (358 LoC) — animação 4.5s pós-onboarding
- `App.tsx` — `<CosmicTransition onComplete={...} />` quando state = 'transitioning'

Pontos fortes:
- `cubic-bezier(0.16, 1, 0.3, 1)` em todas transições (curva spring)
- `step-fade-in` (0.5s) + `step-fade-out` (0.3s) com both
- `feature-list` com stagger via `nth-child` delays (0.30s, 0.38s, 0.46s, 0.54s)
- `fadeUp` + `fadeScaleIn` keyframes pros mockups
- **CosmicTransition**: 80 stars (warp + bright), 4 orbital rings, 3 nebulas, logo central com glow, dissolve final
- SymbolPattern de fundo (overlay sutil de símbolos `>`, `{}`, `()` etc — adapta pro DevSenses como `<>`, `→`, `///`, `</>`)

---

## O que portar

### 1. Animações de step (transições entre passos)

**Copiar do orkestral `onboarding.css`**:
- `.step-fade-in` / `.step-fade-out` (com `forward`/`backward` direction)
- `@keyframes stepFadeIn` / `stepFadeOut`
- `cubic-bezier(0.16, 1, 0.3, 1)` em **todas** transições

**Aplicar no DevSenses Shell.tsx**:
- Estado `phase: 'idle' | 'exiting' | 'entering'`
- Timeout 300ms exit → swap step → 500ms enter
- `data-step={currentStep}` no root pra background shifts contextuais

### 2. Mockups vivos

Cada step tem `step-mockup-card` + `step-mockup-inner` com fade staggered.

**Steps a melhorar no DevSenses**:
- **Welcome** — Logo grande com glow + 3 features `feature-item` staggered (0.30s, 0.38s, 0.46s) — já temos parcial, falta CSS de stagger
- **Workspace** — preview de pasta com diff fake animado
- **ProviderDetect** — terminais simulados estilo orkestral (`mockup-terminal` + `cmd` + `output`)
- **ModelSelect** — cards com hover scale + glow
- **Seniority** — cards com `fadeScaleIn` 0.6s
- **Summary** — checklist com check marks aparecendo um a um

### 3. SymbolPattern overlay

Fundo de cada step com symbols sutis (`<>`, `→`, `///`, `{}`, `()`, `;`) em grade randomizada com baixa opacidade. Já existe em orkestral — copiar `<SymbolPattern />` adaptando os símbolos pra contexto DevSenses (foco em **diff**, **code review**, **AI**).

### 4. Cosmic Transition (★ feature principal)

**Port direto** de `orkestral/src/renderer/src/styles/cosmic-transition.css` (358 LoC).

**Adaptações**:
- Nebula colors: manter purple base (já é o tema)
- Logo central: trocar `logoImg` por logo do DevSenses
- Background final: `--color-background` do DevSenses (não `#fafafa` hardcoded — usar var CSS pra suportar dark mode)

**Arquivos a criar**:
- `src/renderer/src/styles/cosmic-transition.css` — copy do orkestral
- `src/renderer/src/components/CosmicTransition.tsx` — copy do orkestral App.tsx (extrair só o componente)

**Integração no App.tsx**:
```tsx
type AppState = 'loading' | 'onboarding' | 'transitioning' | 'ready'

// quando handleNext chama onComplete:
setAppState('transitioning')

// CosmicTransition chama onComplete após 4.5s:
<CosmicTransition onComplete={() => setAppState('ready')} />
```

A transição cobre a tela inteira (z-index 99999), começa transparente (deixa o purple do último step do onboarding aparecer), evolui pro espaço cósmico, dissolve no `bg-background` da Home.

---

## Plano de execução

### Etapa 1 — Animações de step (1.5h)
1. Copiar `cubic-bezier`, `@keyframes stepFadeIn`/`stepFadeOut` pro `onboarding.css` do DevSenses
2. Refatorar `Onboarding/index.tsx` adicionando `phase: 'idle' | 'exiting' | 'entering'` + timeout sequencing
3. `data-step={n}` no root + variações de bg sutis (pode ficar pra depois)

### Etapa 2 — Stagger nas listas (1h)
1. Adicionar `feature-list` + `feature-item:nth-child(N) { animation-delay }` ao `onboarding.css`
2. Aplicar nos steps Welcome, ProviderDetect, Summary, Seniority

### Etapa 3 — SymbolPattern (1h)
1. Copiar `SymbolPattern` component do orkestral
2. Adaptar símbolos: `<>`, `→`, `///`, `{}`, `()`, `[]`, `;`, `+`, `01`, `<` , `>`
3. Renderizar dentro do Shell.tsx (z-index 0, opacity 0.04)

### Etapa 4 — Cosmic Transition (3h) ★
1. Criar `src/renderer/src/styles/cosmic-transition.css` (port `orkestral/.../cosmic-transition.css`)
2. Criar `src/renderer/src/components/CosmicTransition.tsx` (extract do orkestral App.tsx)
3. Adaptar:
   - Logo: `<Logo />` ou `import logoImg from '@/assets/logo.png'` (verificar onde DevSenses guarda logo)
   - Background final: usar `var(--color-background)` em vez de hardcoded `#fafafa`
4. Refatorar `src/renderer/src/App.tsx` (ou onde mora a state machine de onboarding):
   - `AppState = 'loading' | 'onboarding' | 'transitioning' | 'ready'`
   - Trigger: ao concluir Summary step, ir pra 'transitioning' antes de 'ready'
   - Renderizar `<CosmicTransition onComplete={() => navigate('/home')} />` quando `transitioning`
5. Ajuste de cor de partida: `cosmicBgShift` keyframe — `28% { background: #1e1040 }` pode precisar matchar o purple do último step do DevSenses (verificar)

### Etapa 5 — Mockups dos steps (3h, opcional)
1. **ProviderDetect**: substituir card simples por `mockup-terminal` simulando `> claude --version` → `claude 3.7-sonnet`
2. **Workspace**: preview animado de pasta sendo escaneada (fade-in dos arquivos um a um)
3. **Seniority**: cards com hover scale 1.02 + glow border
4. **Summary**: checklist `[ ] → [✓]` em sequência (delay 200ms entre items)

### Etapa 6 — Polish microinterações (1.5h)
1. Botões com `transition: all 0.2s` — já parcial, conferir consistência
2. Inputs com focus glow primary
3. Cards com `border-color 0.2s, box-shadow 0.2s` no hover

**Total: ~10h** (~1.5 dias úteis)

---

## Arquivos novos

```
src/renderer/src/styles/cosmic-transition.css        ← port direto
src/renderer/src/components/CosmicTransition.tsx     ← extract
src/renderer/src/components/SymbolPattern.tsx        ← port
```

## Arquivos modificados

```
src/renderer/src/pages/Onboarding/Shell.tsx          (phase + symbol pattern)
src/renderer/src/pages/Onboarding/index.tsx          (state machine + transition trigger)
src/renderer/src/pages/Onboarding/onboarding.css     (+ stagger keyframes)
src/renderer/src/pages/Onboarding/steps/Welcome.tsx  (feature-list stagger)
src/renderer/src/pages/Onboarding/steps/Summary.tsx  (checklist anim)
src/renderer/src/pages/Onboarding/steps/ProviderDetect.tsx (terminal mockup)
src/renderer/src/App.tsx                             (AppState transitioning + CosmicTransition mount)
```

---

## Detalhes técnicos da cosmic transition

### Timeline (4.5s total)
| % | t | Evento |
|----|----|--------|
| 0% | 0s | Transparent (purple do onboarding visível) |
| 8% | 0.36s | Fade pra purple deeper |
| 18% | 0.81s | Stars começam a aparecer |
| 28% | 1.26s | Background `#1e1040` (cosmic dark) — stars + orbits visíveis |
| 55% | 2.47s | Logo central com glow máximo |
| 70% | 3.15s | Stars warp começa (estiramento) |
| 80% | 3.6s | Background `#1a0f33` |
| 92% | 4.14s | Background fade pra `var(--color-background)` |
| 100% | 4.5s | Dissolve completo, `onComplete()` |

### Performance
- 80 stars + 4 orbits + 3 nebulas + logo = ~88 elementos animados
- `will-change: transform, opacity` nos elementos pesados
- `transform` only (sem layout/paint thrashing)
- `pointer-events: none` em decorations

### Acessibilidade
- Respeitar `prefers-reduced-motion`: fade simples 300ms se reduced
- ARIA: `<div role="status" aria-live="polite" aria-label="Iniciando DevSenses">` no root

```css
@media (prefers-reduced-motion: reduce) {
  .cosmic-root * {
    animation: none !important;
  }
  .cosmic-bg-overlay {
    animation: cosmicBgShiftReduced 0.6s ease-out forwards;
  }
}
@keyframes cosmicBgShiftReduced {
  0%   { background: transparent; }
  100% { background: var(--color-background); }
}
```

---

## Riscos

- **Cor de partida da cosmic**: precisa matchar o purple do último step do onboarding pra não dar "flash". Validar com screenshot side-by-side.
- **Logo path**: DevSenses tem `Logo` component (`@/components/Logo`). Verificar se exporta versão estática ou se precisa wrap.
- **Reduced motion**: testar em macOS (System Settings → Accessibility → Reduce Motion).
- **prefers-color-scheme**: cosmic transition deve funcionar em dark + light mode (background final via CSS var).
- **Performance em mac antigo**: 80 elementos animados pode dropar frames. Fallback: 40 stars se device < M1.

---

## Critérios de aceite

- [ ] Onboarding usa `cubic-bezier(0.16, 1, 0.3, 1)` consistentemente
- [ ] Steps com listas têm stagger (delays escalonados)
- [ ] SymbolPattern visível como background sutil
- [ ] Conclusão do onboarding dispara CosmicTransition de 4.5s
- [ ] Transição matcha cor do último step (zero flash)
- [ ] Pós-transição, usuário cai na Home com fade-in sutil
- [ ] `prefers-reduced-motion` faz fade simples 300ms
- [ ] Funciona em dark + light mode
- [ ] Não dropa frames em M1 padrão

---

## Próximos passos pra outro chat

Esse plano + o CAPITAO_DIFF_PLAN.md cobrem **dois trabalhos paralelos**:

1. **Capitão Diff** (chat novo, repo novo): bootstrap completo seguindo `CAPITAO_DIFF_PLAN.md`. Quando chegar no Sprint 0 (onboarding), seguir este `ONBOARDING_REVAMP_PLAN.md` como referência de design.

2. **DevSenses** (chat atual): aplicar este `ONBOARDING_REVAMP_PLAN.md` direto no projeto pra deixar onboarding atual no nível do orkestral.

A cosmic transition é o item compartilhado: porta uma vez no DevSenses, copia exatamente igual pro Capitão Diff (só adapta logo central).
