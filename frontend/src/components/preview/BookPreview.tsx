import { useMemo } from 'react'
import { renderMarkdown } from '../../lib/markdown'

interface BookPreviewProps {
  content: string
}

export default function BookPreview({ content }: BookPreviewProps) {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <div className="h-full overflow-auto p-6 bg-white dark:bg-slate-900">
      <article
        className="preview-content max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}