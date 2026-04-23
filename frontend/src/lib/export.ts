import { saveAs } from 'file-saver'
import type { Book } from '../types'

export function exportToMarkdown(book: Book): string {
  let markdown = `# ${book.title}\n\n`

  if (book.author) {
    markdown += `**Author:** ${book.author}\n\n`
  }

  if (book.description) {
    markdown += `${book.description}\n\n`
  }

  markdown += `---\n\n`

  for (const chapter of book.chapters.sort((a, b) => a.order - b.order)) {
    markdown += `## ${chapter.title}\n\n`
    markdown += `${chapter.content}\n\n`
  }

  return markdown
}

export function downloadMarkdown(book: Book): void {
  const content = exportToMarkdown(book)
  const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, filename)
}