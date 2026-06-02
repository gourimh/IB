import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Topic, type TopicsResponse } from '../lib/api'

export function useTopics(status?: string) {
  return useQuery({
    queryKey: ['topics', status],
    queryFn: async () => {
      const params = status ? { status } : {}
      const res = await api.get<TopicsResponse>('/api/topics', { params })
      return res.data.topics
    },
    staleTime: 60_000,
  })
}

export function useGenerateTopics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (count: number = 6) => {
      const res = await api.post<TopicsResponse>('/api/topics/generate', null, {
        params: { count },
      })
      return res.data.topics
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/topics/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}

export function useUpdateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      post_id,
    }: {
      id: string
      status: Topic['status']
      post_id?: string
    }) => {
      const res = await api.patch<Topic>(`/api/topics/${id}`, {
        status,
        post_id: post_id || '',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}
