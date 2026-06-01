import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CopyButton } from '../components/ui/CopyButton'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Spinner } from '../components/ui/Spinner'
import { usePost } from '../hooks/usePosts'
import { useEngagement } from '../hooks/useEngagement'
import { useGenerateStore } from '../store/generateStore'
import { api } from '../lib/api'
import { formatDate, getWinnerScore, cn } from '../lib/utils'
import type { EngagementPayload } from '../lib/api'

function CritiqueDisplay({ critique }: { critique: Record<string, unknown> }) {
  const dims = [
    { key: 'hook_strength', label: 'Hook', note: 'hook_note' },
    { key: 'readability', label: 'Readability', note: 'readability_note' },
    { key: 'cta_clarity', label: 'CTA Clarity', note: 'cta_note' },
    { key: 'brand_alignment', label: 'Brand Fit', note: 'brand_note' },
    { key: 'estimated_virality', label: 'Virality Est.', note: 'virality_note' },
  ]

  return (
    <div className="space-y-2">
      {dims.map((d) => {
        const score = critique[d.key] as number | undefined
        const note = critique[d.note] as string | undefined
        if (score == null) return null
        return (
          <div key={d.key} className="flex items-start gap-3">
            <div className="flex items-center gap-1.5 min-w-[100px]">
              <span className="text-xs text-text-muted">{d.label}</span>
              <span
                className={cn(
                  'text-xs font-bold ml-auto',
                  score >= 8
                    ? 'text-brand-teal'
                    : score >= 6
                    ? 'text-brand-amber'
                    : 'text-status-error'
                )}
              >
                {score}/10
              </span>
            </div>
            {note && <p className="text-xs text-text-secondary flex-1">{note}</p>}
          </div>
        )
      })}
      {typeof critique.top_improvement === 'string' && critique.top_improvement && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-text-muted mb-1">Top improvement</p>
          <p className="text-xs text-text-secondary">{critique.top_improvement}</p>
        </div>
      )}
    </div>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary bg-white hover:bg-surface transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="px-4 py-4 border-t border-border bg-white">{children}</div>}
    </div>
  )
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: post, isLoading } = usePost(id)
  const engagement = useEngagement(id || '')
  const { actions } = useGenerateStore()
  const [showEngagementForm, setShowEngagementForm] = useState(false)

  const { register, handleSubmit } = useForm<EngagementPayload>({
    defaultValues: { impressions: 0, reactions: 0, comments: 0, shares: 0, reposts: 0 },
  })

  const handleRegenerate = async () => {
    if (!id) return
    try {
      const res = await api.post<{ session_id: string }>(`/api/regenerate/${id}`)
      actions.startGeneration(res.data.session_id)
      navigate('/')
    } catch (e: unknown) {
      if (e instanceof Error) actions.setError(e.message)
    }
  }

  const handleEngagement = (data: EngagementPayload) => {
    engagement.mutate(data)
    setShowEngagementForm(false)
  }

  if (isLoading) {
    return (
      <div>
        <TopBar title="Post detail" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div>
        <TopBar title="Post detail" />
        <div className="p-8 text-text-muted">Post not found.</div>
      </div>
    )
  }

  const winnerScore = getWinnerScore(post)

  return (
    <div>
      <TopBar title="Post detail" />
      <div className="p-6 lg:p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <h2 className="text-2xl font-bold text-text-primary mb-6 leading-tight">{post.topic}</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:flex-1 min-w-0 space-y-5">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Final post</h3>
                <CopyButton text={post.final_post} />
              </div>
              <div className="prose-linkedin text-text-primary select-text">{post.final_post}</div>
            </Card>

            <Accordion title="Draft comparison (A vs B)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-text-muted">Draft A</span>
                    {post.winning_variant === 'A' && <Badge variant="winner">Winner</Badge>}
                  </div>
                  <div className="prose-linkedin text-text-secondary text-xs">{post.draft_a}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-text-muted">Draft B</span>
                    {post.winning_variant === 'B' && <Badge variant="winner">Winner</Badge>}
                  </div>
                  <div className="prose-linkedin text-text-secondary text-xs">{post.draft_b}</div>
                </div>
              </div>
            </Accordion>

            {(post.critique_a || post.critique_b) && (
              <Accordion title="Agent critique">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {post.critique_a && Object.keys(post.critique_a).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-3">Critique A</p>
                      <CritiqueDisplay critique={post.critique_a as Record<string, unknown>} />
                    </div>
                  )}
                  {post.critique_b && Object.keys(post.critique_b).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-3">Critique B</p>
                      <CritiqueDisplay critique={post.critique_b as Record<string, unknown>} />
                    </div>
                  )}
                </div>
              </Accordion>
            )}
          </div>

          <div className="lg:w-[260px] shrink-0 space-y-4">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="tone" tone={post.tone}>
                    {post.tone.replace('-', ' ')}
                  </Badge>
                  <span className="text-xs text-text-muted">{formatDate(post.created_at)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-2xs text-text-muted mb-0.5">Virality score</div>
                    <div className="text-3xl font-bold text-brand-amber">
                      {winnerScore.toFixed(0)}
                    </div>
                  </div>
                  <ScoreRing score={winnerScore} size={56} />
                </div>

                <div>
                  <div className="text-2xs text-text-muted mb-0.5">Engagement score</div>
                  {post.engagement_score > 0 ? (
                    <div className="text-2xl font-bold text-brand-teal">
                      {post.engagement_score.toFixed(2)}
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">Not logged</span>
                  )}
                </div>

                <div>
                  <div className="text-2xs text-text-muted mb-0.5">Winner</div>
                  <Badge variant="winner">Draft {post.winning_variant}</Badge>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setShowEngagementForm((v) => !v)}
              >
                <TrendingUp size={13} />
                Log engagement
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={handleRegenerate}>
                <RefreshCw size={13} />
                Regenerate
              </Button>
            </div>

            {showEngagementForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <p className="text-xs font-semibold text-text-primary mb-3">Log engagement</p>
                  <form onSubmit={handleSubmit(handleEngagement)} className="space-y-2">
                    {(['impressions', 'reactions', 'comments', 'shares', 'reposts'] as const).map(
                      (f) => (
                        <div key={f} className="flex items-center gap-2">
                          <label className="text-xs text-text-muted w-20 capitalize">{f}</label>
                          <input
                            type="number"
                            min={0}
                            {...register(f, { valueAsNumber: true })}
                            className="flex-1 rounded-lg border border-border px-2 py-1 text-xs focus:border-brand-teal"
                          />
                        </div>
                      )
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full mt-1"
                      loading={engagement.isPending}
                    >
                      Save
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
