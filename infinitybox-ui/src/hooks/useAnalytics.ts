import { useQuery } from '@tanstack/react-query'
import { api, type AnalyticsData } from '../lib/api'

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await api.get<AnalyticsData>('/api/analytics')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
