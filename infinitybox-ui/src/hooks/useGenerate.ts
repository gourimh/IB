import { useMutation } from '@tanstack/react-query'
import { api, type GenerateRequest } from '../lib/api'
import { useGenerateStore } from '../store/generateStore'

export function useGenerate() {
  const { startGeneration, setError } = useGenerateStore((s) => s.actions)

  return useMutation({
    mutationFn: async (params: GenerateRequest) => {
      const response = await api.post<{ session_id: string }>('/api/generate', params)
      return response.data
    },
    onSuccess: (data) => {
      startGeneration(data.session_id)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })
}
