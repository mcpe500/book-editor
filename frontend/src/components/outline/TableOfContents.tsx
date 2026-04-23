import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBookStore } from '../../stores/bookStore'
import type { Book } from '../../types'
import OutlineItem from './OutlineItem'

interface TableOfContentsProps {
  book: Book
  currentChapterId?: string
}

export default function TableOfContents({ book, currentChapterId }: TableOfContentsProps) {
  const { setCurrentChapter, addChapter } = useBookStore()
  const navigate = useNavigate()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showNewChapter, setShowNewChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return
    try {
      const chapter = await addChapter(newChapterTitle)
      setCurrentChapter(chapter)
      setNewChapterTitle('')
      setShowNewChapter(false)
    } catch (error) {
      console.error('Failed to add chapter:', error)
    }
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order)

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-800">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Chapters</h2>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {sortedChapters.map((chapter) => (
          <OutlineItem
            key={chapter.id}
            chapter={chapter}
            isExpanded={expandedIds.has(chapter.id)}
            isActive={chapter.id === currentChapterId}
            onToggle={() => toggleExpand(chapter.id)}
            onSelect={() => {
              setCurrentChapter(chapter)
              navigate(`/editor/${book.id}/${chapter.id}`)
            }}
          />
        ))}
      </div>

      {showNewChapter ? (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
            placeholder="Chapter title"
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddChapter}
              className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewChapter(false)}
              className="flex-1 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewChapter(true)}
          className="m-3 flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Chapter
        </button>
      )}
    </div>
  )
}