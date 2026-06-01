import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type Post, type PostsResponse } from '../lib/api'

export function usePosts(tone?: string, search?: string) {
  return useInfiniteQuery({
    queryKey: ['posts', tone, search],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, unknown> = { page: pageParam, limit: 20 }
      if (tone && tone !== 'all') params.tone = tone
      if (search) params.search = search
      const res = await api.get<PostsResponse>('/api/posts', { params })
      return res.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.posts).length
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
  })
}

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get<Post>(`/api/posts/${postId}`)
      return res.data
    },
    enabled: !!postId,
  })
}
