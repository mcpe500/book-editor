import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code, Link, Image, Table, Calculator } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'

export default function EditorToolbar() {
  const { togglePreview, toggleOutline, isPreviewVisible, isOutlineVisible, editorView } = useEditorStore()

  const insertMarkdown = (before: string, after = '') => {
    if (!editorView) return

    const selection = editorView.state.selection.main
    const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)

    if (selection.empty) {
      const insertText = `${before}${after}`
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: insertText },
        selection: { anchor: selection.from + before.length },
      })
      editorView.focus()
      return
    }

    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `${before}${selectedText}${after}`,
      },
      selection: {
        anchor: selection.from + before.length,
        head: selection.to + before.length,
      },
    })
    editorView.focus()
  }

  const tools = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: Heading1, label: 'Heading 1', action: () => insertMarkdown('# ') },
    { icon: Heading2, label: 'Heading 2', action: () => insertMarkdown('## ') },
    { icon: List, label: 'Bullet List', action: () => insertMarkdown('- ') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertMarkdown('1. ') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: Image, label: 'Image', action: () => insertMarkdown('![alt](', ')') },
    { icon: Table, label: 'Table', action: () => insertMarkdown('| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |') },
    { icon: Calculator, label: 'Math', action: () => insertMarkdown('$$', '$$') },
  ]

  return (
    <div className="h-10 border-b border-slate-200 dark:border-slate-700 flex items-center px-2 gap-1">
      {tools.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          title={label}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={toggleOutline}
        className={`px-3 py-1 text-sm rounded ${isOutlineVisible ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        Outline
      </button>
      <button
        onClick={togglePreview}
        className={`px-3 py-1 text-sm rounded ${isPreviewVisible ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        Preview
      </button>
    </div>
  )
}