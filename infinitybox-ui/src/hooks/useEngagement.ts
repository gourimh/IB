import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type EngagementPayload } from '../lib/api'

export function useEngagement(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: EngagementPayload) => {
      const res = await api.patch(`/api/posts/${postId}/engagement`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
