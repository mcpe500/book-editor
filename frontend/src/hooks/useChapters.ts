import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Chapter } from '../types'

export function useChapters(bookId: string) {
  return useQuery({
    queryKey: ['books', bookId, 'chapters'],
    queryFn: async () => {
      const { data } = await api.get<Chapter[]>(`/books/${bookId}/chapters`)
      return data
    },
    enabled: !!bookId,
  })
}

export function useCreateChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, title }: { bookId: string; title: string }) => {
      const { data } = await api.post<Chapter>(`/books/${bookId}/chapters`, { title })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books', variables.bookId, 'chapters'] })
    },
  })
}

export function useUpdateChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, chapterId, ...updates }: Partial<Chapter> & { bookId: string; chapterId: string }) => {
      const { data } = await api.put<Chapter>(`/books/${bookId}/chapters/${chapterId}`, updates)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books', variables.bookId, 'chapters'] })
    },
  })
}

export function useDeleteChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, chapterId }: { bookId: string; chapterId: string }) => {
      await api.delete(`/books/${bookId}/chapters/${chapterId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books', variables.bookId, 'chapters'] })
    },
  })
}

export function useReorderChapters() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, chapterIds }: { bookId: string; chapterIds: string[] }) => {
      await api.patch(`/books/${bookId}/chapters/reorder`, { chapterIds })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books', variables.bookId, 'chapters'] })
    },
  })
}