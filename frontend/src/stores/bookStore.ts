import { create } from 'zustand';
import type { Book, Chapter } from '../types';
import api from '../lib/api';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  currentChapter: Chapter | null;
  loading: boolean;
  error: string | null;
}

interface BookStore extends BookState {
  loadBooks: () => Promise<void>
  createBook: (title: string, author?: string, description?: string) => Promise<Book>
  updateBook: (id: string, data: Partial<Book>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  setCurrentBook: (book: Book | null) => void
  setCurrentChapter: (chapter: Chapter | null) => void
  saveChapter: (chapterId: string, content: string) => Promise<void>
  addChapter: (title: string, content?: string) => Promise<Chapter>
  updateChapter: (chapterId: string, data: Partial<Chapter>) => Promise<void>
  deleteChapter: (chapterId: string) => Promise<void>
  reorderChapters: (chapterIds: string[]) => Promise<void>
  loadBook: (id: string) => Promise<Book | null>
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  currentBook: null,
  currentChapter: null,
  loading: false,
  error: null,

  loadBooks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Book[]>('/books');
      set({ books: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createBook: async (title: string, author?: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Book>('/books', { title, author, description });
      set((state) => ({
        books: [response.data, ...state.books],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  loadBook: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Book>(`/books/${id}`);
      set({ currentBook: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  updateBook: async (id: string, data: Partial<Book>) => {
    try {
      const response = await api.put<Book>(`/books/${id}`, data);
      set((state) => ({
        books: state.books.map((b) => (b.id === id ? response.data : b)),
        currentBook: state.currentBook?.id === id ? response.data : state.currentBook,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteBook: async (id: string) => {
    try {
      await api.delete(`/books/${id}`);
      set((state) => ({
        books: state.books.filter((b) => b.id !== id),
        currentBook: state.currentBook?.id === id ? null : state.currentBook,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setCurrentBook: (book: Book | null) => set({ currentBook: book }),

  setCurrentChapter: (chapter: Chapter | null) => set({ currentChapter: chapter }),

  saveChapter: async (chapterId: string, content: string) => {
    const { currentBook } = get();
    if (!currentBook) return;

    try {
      const response = await api.put<Chapter>(`/books/${currentBook.id}/chapters/${chapterId}`, { content });
      set((state) => ({
        currentBook: state.currentBook
          ? {
              ...state.currentBook,
              chapters: state.currentBook.chapters.map((ch) =>
                ch.id === chapterId ? response.data : ch
              ),
              updatedAt: new Date().toISOString(),
            }
          : null,
        currentChapter: state.currentChapter?.id === chapterId ? response.data : state.currentChapter,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addChapter: async (title: string, content = '') => {
    const { currentBook } = get();
    if (!currentBook) throw new Error('No book selected');

    try {
      const response = await api.post<Chapter>(`/books/${currentBook.id}/chapters`, { title, content });
      set((state) => ({
        currentBook: state.currentBook
          ? { ...state.currentBook, chapters: [...state.currentBook.chapters, response.data] }
          : null,
      }));
      return response.data;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateChapter: async (chapterId: string, data: Partial<Chapter>) => {
    const { currentBook } = get();
    if (!currentBook) throw new Error('No book selected');

    try {
      const response = await api.put<Chapter>(`/books/${currentBook.id}/chapters/${chapterId}`, data);
      set((state) => ({
        currentBook: state.currentBook
          ? {
              ...state.currentBook,
              chapters: state.currentBook.chapters.map((ch) =>
                ch.id === chapterId ? response.data : ch
              ),
            }
          : null,
        currentChapter: state.currentChapter?.id === chapterId ? response.data : state.currentChapter,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteChapter: async (chapterId: string) => {
    const { currentBook } = get();
    if (!currentBook) throw new Error('No book selected');

    try {
      await api.delete(`/books/${currentBook.id}/chapters/${chapterId}`);
      set((state) => ({
        currentBook: state.currentBook
          ? {
              ...state.currentBook,
              chapters: state.currentBook.chapters.filter((ch) => ch.id !== chapterId),
            }
          : null,
        currentChapter: state.currentChapter?.id === chapterId ? null : state.currentChapter,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  reorderChapters: async (chapterIds: string[]) => {
    const { currentBook } = get();
    if (!currentBook) return;

    try {
      await api.patch(`/books/${currentBook.id}/chapters/reorder`, { chapterIds });
      const reorderedChapters = chapterIds
        .map((id, index) => {
          const chapter = currentBook.chapters.find((ch) => ch.id === id);
          return chapter ? { ...chapter, order: index + 1 } : null;
        })
        .filter(Boolean) as Chapter[];

      set((state) => ({
        currentBook: state.currentBook
          ? { ...state.currentBook, chapters: reorderedChapters }
          : null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
