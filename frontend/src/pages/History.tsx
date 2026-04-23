import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trash2, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { formatDateTime } from '../lib/utils'
import type { Version } from '../types'

export default function History() {
  const { bookId } = useParams<{ bookId: string }>()
  const queryClient = useQueryClient()

  const { data: versions, isLoading } = useQuery({
    queryKey: ['books', bookId, 'versions'],
    queryFn: async () => {
      const { data } = await api.get<Version[]>(`/books/${bookId}/versions`)
      return data
    },
    enabled: !!bookId,
  })

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      await api.post(`/books/${bookId}/versions/${versionId}/restore`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId, 'versions'] })
    },
  })

  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      await api.delete(`/books/${bookId}/versions/${versionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId, 'versions'] })
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to={`/editor/${bookId}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Version History</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : versions?.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No versions saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions?.map((version) => (
              <div
                key={version.id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {version.label || 'Auto-save'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {formatDateTime(version.timestamp)} · {version.wordCount.toLocaleString()} words
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => restoreVersion.mutate(version.id)}
                    className="flex items-center gap-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this version?')) {
                        deleteVersion.mutate(version.id)
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}