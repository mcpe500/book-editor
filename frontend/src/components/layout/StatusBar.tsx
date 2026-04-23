interface StatusBarProps {
  hasUnsavedChanges: boolean
  currentChapter?: string
  wordCount: number
  lastSaveError?: string | null
}

export default function StatusBar({ hasUnsavedChanges, currentChapter, wordCount, lastSaveError }: StatusBarProps) {
  return (
    <footer className="h-6 border-t border-slate-200 dark:border-slate-700 flex items-center px-4 text-xs text-slate-500">
      <div className="flex items-center gap-4">
        <span>
          {lastSaveError ? (
            <span className="text-red-600">Save failed</span>
          ) : hasUnsavedChanges ? (
            <span className="text-amber-600">Unsaved changes</span>
          ) : (
            <span className="text-green-600">All changes saved</span>
          )}
        </span>
        {lastSaveError && <span className="text-red-600 truncate max-w-80">{lastSaveError}</span>}
        <span>Words: {wordCount.toLocaleString()}</span>
        {currentChapter && <span>Chapter: {currentChapter}</span>}
      </div>
    </footer>
  )
}