import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { useBookStore } from '../stores/bookStore'
import { debounce } from '../lib/utils'

export function useEditor() {
  const { currentBook, currentChapter, saveChapter } = useBookStore()
  const {
    content,
    setContent,
    hasUnsavedChanges,
    isPreviewVisible,
    isOutlineVisible,
    togglePreview,
    toggleOutline,
    markSaved,
    setLastSaveError,
    lastSaveError,
  } = useEditorStore()

  const autoSaveRef = useRef(
    debounce(async (chapterId: string, newContent: string) => {
      try {
        await saveChapter(chapterId, newContent)
        markSaved()
      } catch (error) {
        const message = (error as Error)?.message || 'Auto-save failed'
        setLastSaveError(message)
        console.error('Auto-save failed:', error)
      }
    }, 30000)
  )

  useEffect(() => {
    if (currentChapter) {
      setContent(currentChapter.content)
      markSaved()
    }
  }, [currentChapter?.id])

  useEffect(() => {
    if (hasUnsavedChanges && currentChapter) {
      autoSaveRef.current(currentChapter.id, content)
    }
  }, [content, hasUnsavedChanges, currentChapter?.id])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [setContent])

  return {
    content,
    setContent: handleContentChange,
    hasUnsavedChanges,
    lastSaveError,
    isPreviewVisible,
    isOutlineVisible,
    togglePreview,
    toggleOutline,
    currentBook,
    currentChapter,
  }
}