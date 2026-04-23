import { useState, useRef, useEffect } from 'react'
import { FileText, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react'
import type { Chapter } from '../../types'

interface ChapterContextMenuProps {
  chapter: Chapter
  onRename: (title: string) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  position: { x: number; y: number }
  onClose: () => void
}

export default function ChapterContextMenu({
  chapter,
  onRename,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  position,
  onClose,
}: ChapterContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [title, setTitle] = useState(chapter.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  const handleRename = () => {
    if (title.trim() && title !== chapter.title) {
      onRename(title.trim())
    }
    setIsRenaming(false)
  }

  useEffect(() => {
    const handleClickOutside = () => onClose()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  return (
    <div
      className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-48 z-50"
      style={{ left: position.x, top: position.y }}
    >
      {isRenaming ? (
        <div className="px-3 py-1">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="w-full px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none"
          />
        </div>
      ) : (
        <>
          <button
            onClick={() => { setIsRenaming(true); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <FileText size={14} />
            Rename
          </button>

          {onMoveUp && (
            <button
              onClick={() => { onMoveUp(); onClose() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowUp size={14} />
              Move Up
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={() => { onMoveDown(); onClose() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowDown size={14} />
              Move Down
            </button>
          )}

          <button
            onClick={() => { onDuplicate(); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Copy size={14} />
            Duplicate
          </button>

          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

          <button
            onClick={() => { onDelete(); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </>
      )}
    </div>
  )
}