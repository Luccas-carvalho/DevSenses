# macOS Code Signing + Notarization

Guia pra gerar `.dmg` assinado e notarizado pela Apple, sem warning de "app não verificado".

---

## Pré-requisitos

1. **Apple Developer Account** — $99/ano. Sem isso, build sai unsigned (mas funciona pra dev/teste).
2. **Developer ID Application certificate** — gerado em [developer.apple.com](https://developer.apple.com/account/resources/certificates/list).
3. **App-specific password** — em [appleid.apple.com](https://appleid.apple.com/account/manage) → Security → App-Specific Passwords.

---

## Setup local

### 1. Importa cert no Keychain

Baixa o cert `.p12` da Apple e dá double-click. Ele vai pra "login" keychain.

Verifica:

```bash
security find-identity -v -p codesigning
```

Deve listar algo tipo:
```
1) AABBCC1122 "Developer ID Application: Luccas Carvalho (XXXXXXXXXX)"
```

### 2. Cria `.env.signing` (NÃO commit, já no `.gitignore`)

```bash
APPLE_DEVELOPER_IDENTITY="Developer ID Application: Luccas Carvalho (XXXXXXXXXX)"
APPLE_ID=seu-email@apple.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

> `APPLE_TEAM_ID` aparece em developer.apple.com → Membership.

### 3. Build assinado

```bash
set -a; source .env.signing; set +a
npm run build:mac:signed
```

Saída em `release/`. Verifica:

```bash
codesign --verify --deep --strict --verbose=2 release/mac-arm64/DevSenses.app
spctl -a -t exec -vv release/mac-arm64/DevSenses.app
```

Esperado:
```
release/mac-arm64/DevSenses.app: accepted
source=Notarized Developer ID
```

---

## Setup CI/CD (GitHub Actions)

Adicionar secrets em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|--------|-------|
| `CSC_LINK` | base64 do `.p12` (`base64 -i cert.p12 \| pbcopy`) |
| `CSC_KEY_PASSWORD` | senha do `.p12` |
| `APPLE_DEVELOPER_IDENTITY` | "Developer ID Application: ... (TEAMID)" |
| `APPLE_ID` | email Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific |
| `APPLE_TEAM_ID` | team ID |

Workflow exemplo (`.github/workflows/release.yml`):

```yaml
name: Release mac signed
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: macos-14
    env:
      CSC_LINK: ${{ secrets.CSC_LINK }}
      CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
      APPLE_DEVELOPER_IDENTITY: ${{ secrets.APPLE_DEVELOPER_IDENTITY }}
      APPLE_ID: ${{ secrets.APPLE_ID }}
      APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
      APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:mac:signed
      - uses: softprops/action-gh-release@v1
        with:
          files: release/*.dmg
```

---

## Troubleshooting

### "Identity not found"

```bash
security find-identity -v -p codesigning
```

Se vazio: re-importa o `.p12`, ou gera certificado novo no developer.apple.com.

### "Notarization failed"

Roda manualmente pra ver log:

```bash
xcrun notarytool log <submission-id> \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

Causas comuns:
- `entitlements.mac.plist` faltando capabilities (camera/mic se app declara mas não usa).
- `hardenedRuntime: false` — precisa ser `true` pra notarize.
- Binário não-signado dentro do app (better-sqlite3 native module). Verificar com `codesign --verify --deep`.

### Hardened Runtime + native modules

`better-sqlite3` precisa estar dentro do `asarUnpack`. Já configurado em `electron-builder.yml`:

```yaml
asarUnpack:
  - resources/**
```

Se `better-sqlite3.node` quebrar com Hardened Runtime, adicionar:

```xml
<!-- build/entitlements.mac.plist -->
<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
<true/>
```

(JS engine precisa disso — V8 JIT.)

---

## Sem Apple Developer Account

Build não-assinado funciona pra dev e distribuição informal. Usuários terão que:

1. Click direito no `.dmg` → Open
2. Confirmar "Open Anyway" em System Settings → Privacy & Security

Não recomendado pra release pública. **Considera o $99/ano essencial pra produto sério.**

---

## Próximos passos

- [ ] Comprar Apple Developer Account
- [ ] Gerar Developer ID Application cert
- [ ] Criar app-specific password
- [ ] Testar `npm run build:mac:signed` localmente
- [ ] Configurar GitHub Action com secrets
- [ ] Tag `v0.0.1` → release público auto-assinado
