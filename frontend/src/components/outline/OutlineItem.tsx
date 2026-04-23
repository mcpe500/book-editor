import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { useDeleteChapter, useUpdateChapter } from '../../hooks/useChapters'
import { useBookStore } from '../../stores/bookStore'
import type { Chapter } from '../../types'

interface OutlineItemProps {
  chapter: Chapter
  isExpanded: boolean
  isActive: boolean
  onToggle: () => void
  onSelect: () => void
}

export default function OutlineItem({ chapter, isExpanded, isActive, onToggle, onSelect }: OutlineItemProps) {
  const { currentBook } = useBookStore()
  const deleteChapter = useDeleteChapter()
  const updateChapter = useUpdateChapter()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)

  const handleDelete = async () => {
    if (!confirm('Delete this chapter?')) return
    try {
      await deleteChapter.mutateAsync({ bookId: currentBook?.id || '', chapterId: chapter.id })
    } catch (error) {
      console.error('Failed to delete chapter:', error)
    }
  }

  const handleRename = async () => {
    if (!editTitle.trim() || editTitle === chapter.title) {
      setIsEditing(false)
      return
    }
    try {
      await updateChapter.mutateAsync({ bookId: currentBook?.id || '', chapterId: chapter.id, title: editTitle })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to rename chapter:', error)
    }
  }

  return (
    <div className="group">
      <div
        className={`flex items-center gap-1 px-3 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors ${
          isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className="p-0.5"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <FileText size={14} className="text-slate-400" />

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="flex-1 px-1 text-sm bg-white dark:bg-slate-900 border border-primary-500 rounded focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            onClick={onSelect}
          >
            {chapter.title}
          </span>
        )}

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Edit2 size={14} />
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}