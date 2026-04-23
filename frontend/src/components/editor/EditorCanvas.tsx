import { useEffect, useRef } from 'react'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useEditorStore } from '../../stores/editorStore'

interface EditorCanvasProps {
  content: string
  onChange: (content: string) => void
}

export default function EditorCanvas({ content, onChange }: EditorCanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { setCursorPosition, setEditorView } = useEditorStore()

  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
      if (update.selectionSet) {
        setCursorPosition(update.state.selection.main.head)
      }
    })

    const state = EditorState.create({
      doc: content,
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        placeholder('Start writing...'),
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view
    setEditorView(view)

    return () => {
      setEditorView(null)
      view.destroy()
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (view && content !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      })
    }
  }, [content])

  return <div ref={editorRef} className="h-full overflow-auto" />
}