import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { TopicForm } from '../components/generate/TopicForm'
import { AgentPipeline } from '../components/generate/AgentPipeline'
import { StreamingPost } from '../components/generate/StreamingPost'
import { PostVariants } from '../components/generate/PostVariants'
import { FinalPost } from '../components/generate/FinalPost'
import { useGenerate } from '../hooks/useGenerate'
import { useWebSocket } from '../hooks/useWebSocket'
import { useEngagement } from '../hooks/useEngagement'
import { useGenerateStore } from '../store/generateStore'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export function GeneratePage() {
  const navigate = useNavigate()
  const {
    sessionId,
    status,
    nodeStatuses,
    streamedText,
    optimisedA,
    optimisedB,
    scoreA,
    scoreB,
    winner,
    finalPost,
    postId,
    error,
    actions,
  } = useGenerateStore()

  const generate = useGenerate()
  useWebSocket(sessionId)

  const engagement = useEngagement(postId || '')

  const handleRegenerate = async () => {
    if (!postId) return
    try {
      const res = await api.post<{ session_id: string }>(`/api/regenerate/${postId}`)
      actions.startGeneration(res.data.session_id)
    } catch (e: unknown) {
      if (e instanceof Error) actions.setError(e.message)
    }
  }

  const isLoading = status === 'pending' || status === 'streaming'

  return (
    <div>
      <TopBar title="Generate" />
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-screen-xl">
          <div className="lg:w-[38%] shrink-0">
            <TopicForm
              onSubmit={(data) => generate.mutate(data)}
              isLoading={isLoading}
            />
          </div>

          <div className="lg:flex-1 min-w-0 space-y-5">
            {error && (
              <div className="bg-status-error-light border border-status-error text-status-error rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {status === 'idle' && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <Sparkles size={48} className="text-brand-teal mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Your post will appear here
                </h3>
                <p className="text-sm text-text-muted">
                  Fill in the topic and hit generate.
                </p>
              </motion.div>
            )}

            {(status === 'streaming' || status === 'pending') && (
              <>
                <AgentPipeline nodeStatuses={nodeStatuses} />
                <StreamingPost text={streamedText} nodeStatuses={nodeStatuses} />
              </>
            )}

            {status === 'complete' && (
              <>
                {scoreA !== null && scoreB !== null && winner && (
                  <PostVariants
                    optimisedA={optimisedA}
                    optimisedB={optimisedB}
                    scoreA={scoreA}
                    scoreB={scoreB}
                    winner={winner}
                  />
                )}
                {finalPost && postId && (
                  <FinalPost
                    post={finalPost}
                    postId={postId}
                    onLogEngagement={(data) => engagement.mutate(data)}
                    onRegenerate={handleRegenerate}
                    engagementLoading={engagement.isPending}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
