import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RefreshCw, TrendingUp, Wand2, ChevronDown } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { Card } from '../ui/Card'
import { CopyButton } from '../ui/CopyButton'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import type { EngagementPayload, RefineResponse } from '../../lib/api'

interface FinalPostProps {
  post: string
  postId: string
  onLogEngagement: (data: EngagementPayload) => void
  onRegenerate?: () => void
  engagementLoading?: boolean
}

export function FinalPost({
  post,
  postId,
  onLogEngagement,
  onRegenerate,
  engagementLoading,
}: FinalPostProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)
  const [displayPost, setDisplayPost] = useState(post)
  const [isRefined, setIsRefined] = useState(false)

  const { register, handleSubmit, reset } = useForm<EngagementPayload>({
    defaultValues: { impressions: 0, reactions: 0, comments: 0, shares: 0, reposts: 0 },
  })

  const handleEngagementSubmit = (data: EngagementPayload) => {
    onLogEngagement(data)
    setDialogOpen(false)
    reset()
  }

  const handleRefine = async () => {
    if (!feedback.trim()) return
    setIsRefining(true)
    setRefineError(null)
    try {
      const res = await api.post<RefineResponse>('/api/refine', {
        post: displayPost,
        feedback: feedback.trim(),
      })
      setDisplayPost(res.data.refined_post)
      setIsRefined(true)
      setFeedback('')
      setShowRefine(false)
    } catch (e: unknown) {
      setRefineError(e instanceof Error ? e.message : 'Failed to refine post')
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-text-primary">Final post</h3>
          {isRefined ? (
            <span className="inline-flex items-center gap-1 text-xs text-brand-purple font-medium bg-brand-purple-light px-2 py-0.5 rounded-md">
              <Wand2 size={11} />
              Refined
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-brand-teal font-medium bg-brand-teal-light px-2 py-0.5 rounded-md">
              <CheckCircle size={11} />
              Ready to publish
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <RefreshCw size={13} />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      <Card className="p-5">
        <div className="prose-linkedin text-text-primary select-text">{displayPost}</div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <CopyButton text={displayPost} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRefine((v) => !v)}
          >
            <Wand2 size={13} />
            Request changes
            <ChevronDown
              size={12}
              className={cn('transition-transform duration-200', showRefine && 'rotate-180')}
            />
          </Button>
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <Button variant="secondary" size="sm">
                <TrendingUp size={13} />
                Log engagement →
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/20 z-50" />
              <Dialog.Content
                className={cn(
                  'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
                  'bg-white rounded-2xl border border-border shadow-card-hover p-6 w-[440px] max-w-[95vw]'
                )}
              >
                <Dialog.Title className="text-lg font-semibold text-text-primary mb-1">
                  Log engagement
                </Dialog.Title>
                <Dialog.Description className="text-sm text-text-muted mb-5">
                  Paste the metrics from your LinkedIn post to improve future generations.
                </Dialog.Description>
                <form onSubmit={handleSubmit(handleEngagementSubmit)} className="space-y-3">
                  {(['impressions', 'reactions', 'comments', 'shares', 'reposts'] as const).map(
                    (field) => (
                      <div key={field} className="flex items-center gap-3">
                        <label className="w-24 text-sm text-text-secondary capitalize">{field}</label>
                        <input
                          type="number"
                          min={0}
                          {...register(field, { valueAsNumber: true, min: 0 })}
                          className={cn(
                            'flex-1 rounded-xl border border-border px-3 py-2 text-sm',
                            'focus:border-brand-teal transition-colors'
                          )}
                        />
                      </div>
                    )
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" loading={engagementLoading} className="flex-1">
                      Save engagement
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <AnimatePresence>
          {showRefine && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  What would you like to change?
                </p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="e.g. Make the hook stronger, add more data points, shorten the bullet list, change the tone to be more direct..."
                  className={cn(
                    'w-full resize-none rounded-xl border border-border bg-surface px-4 py-3',
                    'text-sm text-text-primary placeholder-text-muted',
                    'focus:border-brand-teal transition-colors duration-150 leading-relaxed'
                  )}
                />
                {refineError && (
                  <p className="text-xs text-status-error">{refineError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleRefine}
                    disabled={!feedback.trim() || isRefining}
                  >
                    {isRefining ? (
                      <>
                        <Spinner size="sm" />
                        Refining…
                      </>
                    ) : (
                      <>
                        <Wand2 size={13} />
                        Apply changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowRefine(false); setFeedback(''); setRefineError(null) }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
