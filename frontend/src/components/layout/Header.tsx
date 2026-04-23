import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, Settings, MoreVertical, Download, Moon, Sun } from 'lucide-react'
import { useAI } from '../../hooks/useAI'
import { useSettings } from '../../hooks/useSettings'
import type { Book } from '../../types'
import { downloadMarkdown } from '../../lib/export'

interface HeaderProps {
  book: Book
}

export default function Header({ book }: HeaderProps) {
  const { togglePanel } = useAI()
  const { settings, updateTheme } = useSettings()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4">
      <Link
        to="/"
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
      </Link>

      <div className="flex-1">
        <h1 className="font-semibold text-slate-900 dark:text-white truncate">{book.title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePanel}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bot size={18} />
          <span className="hidden sm:inline">AI</span>
        </button>

        <button
          onClick={() => updateTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  downloadMarkdown(book)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Download size={16} />
                Export to Markdown
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                <Settings size={16} />
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}