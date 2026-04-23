import { marked, Renderer } from 'marked'
import katex from 'katex'
import hljs from 'highlight.js'

const renderer = new Renderer()

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  if (lang === 'math' || lang === 'katex') {
    try {
      return katex.renderToString(text, {
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      return `<pre class="katex-error">${text}</pre>`
    }
  }
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}

renderer.codespan = ({ text }: { text: string }) => {
  return `<code>${text}</code>`
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
})

const mathBlockRegex = /\$\$([\s\S]*?)\$\$/g
const mathInlineRegex = /\$([^\$\n]+)\$/g

export function renderMarkdown(content: string): string {
  let processed = content
    .replace(mathBlockRegex, (_match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          throwOnError: false,
          displayMode: true,
        })
      } catch {
        return `<pre class="katex-error">${math}</pre>`
      }
    })
    .replace(mathInlineRegex, (_match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          throwOnError: false,
          displayMode: false,
        })
      } catch {
        return `<code>${math}</code>`
      }
    })

  return marked.parse(processed) as string
}

export function countWords(content: string): number {
  const text = content
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^\$\n]+\$/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/[#*_~\[\]()]/g, '')
    .trim()

  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}