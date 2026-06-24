// prism-react-renderer v2 ships a limited grammar set (no php/ruby/java/csharp/bash/docker/scss/less/toml).
// Strategy: load prismjs separately (it self-registers on window.Prism), pull in its language
// components (they extend that same Prism), then copy the resulting grammars into the renderer's
// internal Prism so <Highlight code lang="php" /> can find them.
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-less'
import 'prismjs/components/prism-toml'

import { Prism as RendererPrism } from 'prism-react-renderer'

Object.assign(RendererPrism.languages, Prism.languages)
