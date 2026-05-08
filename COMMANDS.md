# DevSenses — Comandos úteis

Atalho rápido pros comandos que aparecem com mais frequência. Tudo roda na raiz (`/Users/luccas/Documents/Github/DevSenses`).

## Desenvolvimento

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda em modo dev (hot reload renderer + restart main) |
| `npm run start` | Preview da build (sem dev tools) |
| `npm run typecheck` | TS check em main + renderer |
| `npm run lint` | ESLint com cache |
| `npm run format` | Prettier write em tudo |
| `npm run test` | Vitest one-shot |
| `npm run test:watch` | Vitest watch mode |
| `npm run rebuild` | Recompila `better-sqlite3` pra versão atual do Electron (depois de troca de Node/Electron) |

## Build local

| Comando | Saída |
|---|---|
| `npm run build` | Bundle main+preload+renderer (sem empacotar em DMG/exe) |
| `npm run build:unpack` | Build + `--dir` (gera `release/mac-arm64/DevSenses.app` sem DMG) |
| `npm run build:mac` | DMG completo macOS |
| `npm run build:win` | Instalador NSIS Windows |
| `npm run build:linux` | AppImage Linux |

### Onde os artefatos saem

Tudo vai pra `release/` na raiz:

```
release/
├── DevSenses-0.0.1.dmg                ← macOS instalador (drag-to-Applications)
├── DevSenses-0.0.1-setup.exe          ← Windows instalador NSIS
├── DevSenses-0.0.1.AppImage           ← Linux portable
├── mac-arm64/
│   └── DevSenses.app/                 ← .app pronto (build:unpack)
├── builder-effective-config.yaml      ← config final calculada (debug)
└── latest-mac.yml                     ← metadata pra electron-updater
```

A versão (`0.0.1`) vem de `package.json`. Pra mudar: edita `version` lá e roda de novo.

### DMG — ajustes

Config em `electron-builder.yml > dmg`:
- `background`: `build/dmg-background.png` (540×380, layout do drag-to-Applications)
- `iconSize`: 110px
- Arquivo do app na pos `(140, 220)`, link `/Applications` em `(400, 220)`

Pra trocar o background: substitui `build/dmg-background.png`. SVG fonte em `build/dmg-background.svg`.

## Ícones do app

Quando mexer no logo (`resources/logo.svg`), regenera os ícones (macOS exige safe area de ~80%, então usa `build/icon-mac.svg` que tem o padding correto):

```bash
# 1. Renderiza PNG 1024×1024 com safe area macOS
rsvg-convert -w 1024 -h 1024 build/icon-mac.svg -o build/icon.png
cp build/icon.png resources/icon.png

# 2. Gera .icns (macOS multi-tamanho)
rm -rf build/icon.iconset && mkdir -p build/icon.iconset
for size in 16 32 64 128 256 512 1024; do
  sips -z $size $size build/icon.png --out "build/icon.iconset/icon_${size}x${size}.png" >/dev/null
done
cp build/icon.iconset/icon_32x32.png build/icon.iconset/icon_16x16@2x.png
cp build/icon.iconset/icon_64x64.png build/icon.iconset/icon_32x32@2x.png
cp build/icon.iconset/icon_256x256.png build/icon.iconset/icon_128x128@2x.png
cp build/icon.iconset/icon_512x512.png build/icon.iconset/icon_256x256@2x.png
cp build/icon.iconset/icon_1024x1024.png build/icon.iconset/icon_512x512@2x.png
rm build/icon.iconset/icon_64x64.png build/icon.iconset/icon_1024x1024.png
iconutil -c icns build/icon.iconset -o build/icon.icns
rm -rf build/icon.iconset

# 3. Gera .ico (Windows)
rm -f build/icon.ico
npx --yes png-to-ico build/icon.png > build/icon.ico
```

Dependências externas: `rsvg-convert` (`brew install librsvg`), `sips` (nativo macOS), `iconutil` (nativo macOS), `npx png-to-ico` (baixa on demand).

## Banco de dados (SQLite local)

DB local fica em:
- macOS: `~/Library/Application Support/devsenses/devsenses.db`

Migrations embutidas em `src/main/db/migrations.ts` (rodam no boot). Pra testar do zero:

```bash
rm ~/Library/Application\ Support/devsenses/devsenses.db
npm run dev   # recria com migrations
```

## Reset onboarding

Apaga o flag em settings (sem dropar o DB):

```bash
sqlite3 ~/Library/Application\ Support/devsenses/devsenses.db \
  "UPDATE settings SET value='false' WHERE key='onboarding_completed';"
```

Ou no app: **Settings → Perfil → Refazer onboarding**.

## Auto-update / Release no GitHub

Config em `electron-builder.yml > publish`:
- `provider: github`
- `owner: Luccas-carvalho`
- `repo: DevSenses`

Pra publicar uma release que o `electron-updater` consiga puxar:

```bash
# Bump version no package.json primeiro
GH_TOKEN=ghp_xxx npm run build:mac -- --publish always
```

Sobe DMG + `latest-mac.yml` na release do GitHub. App instalado checa essa URL no boot e a cada 1h.

## Code signing / Notarization (macOS)

Hoje desligado em `electron-builder.yml`:
- `identity: null`
- `hardenedRuntime: false`
- `notarize: false`

Pra ativar (precisa de Developer ID + Apple ID com app-specific password):

```yaml
mac:
  identity: "Developer ID Application: Nome (TEAM_ID)"
  hardenedRuntime: true
  notarize:
    teamId: "TEAM_ID"
```

Variáveis de ambiente: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

## Logs em runtime

- **Main process**: vai pro stdout do terminal onde rodou `npm run dev`
- **Renderer**: DevTools (Cmd+Opt+I no app dev)
- **electron-updater**: log em `~/Library/Logs/devsenses/main.log`

## Troubleshooting rápido

| Sintoma | Comando |
|---|---|
| `better-sqlite3` quebra após `npm install` | `npm run rebuild` |
| Cache esquisito do electron-vite | `rm -rf out/ release/` e rebuilda |
| Ícone do dock continua "Electron" em dev | Conferir `app.setName('DevSenses')` em `src/main/index.ts` (precisa rodar antes de `whenReady`) |
| DMG com ícone gigante no Finder | Regenera `build/icon.icns` com a safe area (seção "Ícones do app" acima) |
