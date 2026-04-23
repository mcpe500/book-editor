import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current)
    }
  }, [code, language])

  const lang = language && hljs.getLanguage(language) ? language : undefined

  return (
    <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
      <code ref={codeRef} className={lang ? `language-${lang}` : ''}>
        {code}
      </code>
    </pre>
  )
}