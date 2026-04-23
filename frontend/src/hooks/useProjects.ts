import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  ProjectExportFormat,
  ProjectManifest,
  ProjectNodeDocument,
  ProjectRuleSet,
  ProjectSummary,
  ProjectTreeResponse,
  ReviseProjectResponse,
} from '../types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<ProjectSummary[]>('/projects')
      return data
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post<ProjectManifest>('/projects', { title })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useProjectTree(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tree'],
    queryFn: async () => {
      const { data } = await api.get<ProjectTreeResponse>(`/projects/${projectId}/tree`)
      return data
    },
    enabled: !!projectId,
  })
}

export async function fetchNodeDocument(projectId: string, nodeId: string) {
  const { data } = await api.get<ProjectNodeDocument>(`/projects/${projectId}/nodes/${nodeId}`)
  return data
}

export async function persistNodeContent(projectId: string, nodeId: string, content: string) {
  const { data } = await api.put<ProjectNodeDocument>(`/projects/${projectId}/nodes/${nodeId}/content`, { content })
  return data
}

export async function createProjectNode(projectId: string, title: string, parentId: string | null, afterNodeId: string | null) {
  const { data } = await api.post<ProjectTreeResponse>(`/projects/${projectId}/nodes`, { title, parentId, afterNodeId })
  return data
}

export async function moveProjectNode(projectId: string, nodeId: string, targetParentId: string | null, targetIndex: number) {
  const { data } = await api.patch<ProjectTreeResponse>(`/projects/${projectId}/nodes/${nodeId}/move`, {
    targetParentId,
    targetIndex,
  })
  return data
}

export async function renameProjectNode(projectId: string, nodeId: string, title: string) {
  const { data } = await api.patch<ProjectTreeResponse>(`/projects/${projectId}/nodes/${nodeId}`, { title })
  return data
}

export async function deleteProjectNode(projectId: string, nodeId: string) {
  const { data } = await api.delete<ProjectTreeResponse>(`/projects/${projectId}/nodes/${nodeId}`)
  return data
}

export async function saveProjectRules(projectId: string, rules: ProjectRuleSet) {
  const { data } = await api.patch<ProjectTreeResponse>(`/projects/${projectId}/rules`, rules)
  return data
}

export async function reviseProject(projectId: string, nodeId: string, instruction: string, selectedText?: string) {
  const { data } = await api.post<ReviseProjectResponse>(`/projects/${projectId}/ai/revise`, {
    nodeId,
    instruction,
    selectedText,
  })
  return data
}

export async function exportProject(projectId: string, format: ProjectExportFormat) {
  const response = await api.post(`/projects/${projectId}/export/${format}`, {}, { responseType: 'blob' })
  const header = response.headers['content-disposition'] as string | undefined
  const match = header?.match(/filename="(.+?)"/)
  return {
    blob: response.data as Blob,
    filename: match?.[1] ?? `export.${format}`,
  }
}
