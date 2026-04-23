import { useState } from 'react'
import { X } from 'lucide-react'
import { isValidLatex, renderLatexMath } from '../../lib/latex'

interface MathInputProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (latex: string, displayMode: boolean) => void
  initialValue?: string
}

export default function MathInput({ isOpen, onClose, onInsert, initialValue = '' }: MathInputProps) {
  const [latex, setLatex] = useState(initialValue)
  const [displayMode, setDisplayMode] = useState(false)

  if (!isOpen) return null

  const handleInsert = () => {
    if (isValidLatex(latex)) {
      onInsert(latex, displayMode)
      setLatex('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Insert LaTeX Math</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">LaTeX Expression</label>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="E = mc^2"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={displayMode}
              onChange={(e) => setDisplayMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Display mode (centered, full width)</span>
          </label>
        </div>

        {latex && (
          <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <div className="text-sm text-slate-500 mb-2">Preview:</div>
            <div
              className="overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: isValidLatex(latex)
                  ? renderLatexMath(latex, displayMode)
                  : '<span class="text-red-500">Invalid LaTeX</span>',
              }}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!isValidLatex(latex)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}