import { create } from 'zustand';
import type { EditorView } from '@codemirror/view'

interface EditorState {
  content: string;
  hasUnsavedChanges: boolean;
  isPreviewVisible: boolean;
  isOutlineVisible: boolean;
  isAITyping: boolean;
  cursorPosition: number;
  editorView: EditorView | null;
  autoSaveTimer: ReturnType<typeof setTimeout> | null;
  lastSavedAt: Date | null;
  lastSaveError: string | null;
}

interface EditorStore extends EditorState {
  setContent: (content: string) => void;
  markUnsaved: () => void;
  markSaved: () => void;
  setLastSaveError: (error: string | null) => void;
  setEditorView: (view: EditorView | null) => void;
  scheduleAutoSave: () => void;
  cancelAutoSave: () => void;
  togglePreview: () => void;
  toggleOutline: () => void;
  setCursorPosition: (pos: number) => void;
  setAITyping: (typing: boolean) => void;
  resetEditor: () => void;
}

const AUTO_SAVE_DELAY = 30000; // 30 seconds

export const useEditorStore = create<EditorStore>((set, get) => ({
  content: '',
  hasUnsavedChanges: false,
  isPreviewVisible: true,
  isOutlineVisible: true,
  isAITyping: false,
  cursorPosition: 0,
  editorView: null,
  autoSaveTimer: null,
  lastSavedAt: null,
  lastSaveError: null,

  setContent: (content: string) => {
    set({ content, hasUnsavedChanges: true });
    get().scheduleAutoSave();
  },

  markUnsaved: () => set({ hasUnsavedChanges: true }),

  markSaved: () => set({
    hasUnsavedChanges: false,
    lastSavedAt: new Date(),
    lastSaveError: null,
  }),

  setLastSaveError: (error: string | null) => set({ lastSaveError: error }),

  setEditorView: (view: EditorView | null) => set({ editorView: view }),

  scheduleAutoSave: () => {
    const { autoSaveTimer, hasUnsavedChanges } = get();

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      const { hasUnsavedChanges } = get();
      if (hasUnsavedChanges) {
        // Trigger save - this should be connected to bookStore.saveChapter
        // The actual save logic should be handled by the component
        set({ autoSaveTimer: null });
      }
    }, AUTO_SAVE_DELAY);

    set({ autoSaveTimer: timer });
  },

  cancelAutoSave: () => {
    const { autoSaveTimer } = get();
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      set({ autoSaveTimer: null });
    }
  },

  togglePreview: () => set((state) => ({ isPreviewVisible: !state.isPreviewVisible })),

  toggleOutline: () => set((state) => ({ isOutlineVisible: !state.isOutlineVisible })),

  setCursorPosition: (pos: number) => set({ cursorPosition: pos }),

  setAITyping: (typing: boolean) => set({ isAITyping: typing }),

  resetEditor: () => {
    const { autoSaveTimer } = get();
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    set({
      content: '',
      hasUnsavedChanges: false,
      isPreviewVisible: true,
      isOutlineVisible: true,
      isAITyping: false,
      cursorPosition: 0,
      editorView: null,
      autoSaveTimer: null,
      lastSavedAt: null,
      lastSaveError: null,
    });
  },
}));
