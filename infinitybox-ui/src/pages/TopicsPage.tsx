import { useState, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Lightbulb, RefreshCw, Sparkles, ChevronDown,
  Archive, CheckCircle2, Clock, LayoutList,
  Building2, TrendingUp, Trash2, X,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'  // used in page loading state
import { cn } from '../lib/utils'
import { useTopics, useGenerateTopics, useUpdateTopic, useDeleteTopic } from '../hooks/useTopics'
import { useGenerateStore } from '../store/generateStore'
import { api } from '../lib/api'
import type { Topic } from '../lib/api'

// ─── helpers ─────────────────────────────────────────────────────────────────

const TONE_LABELS: Record<string, string> = {
  'thought-leadership': 'Thought Leadership',
  storytelling: 'Storytelling',
  'data-driven': 'Data-Driven',
  contrarian: 'Contrarian',
  listicle: 'Listicle',
}

const TONE_COLORS: Record<string, string> = {
  'thought-leadership': 'bg-brand-teal-light text-brand-teal',
  storytelling: 'bg-brand-purple-light text-brand-purple',
  'data-driven': 'bg-brand-amber-light text-brand-amber',
  contrarian: 'bg-status-error-light text-status-error',
  listicle: 'bg-surface text-text-secondary',
}

function priorityColor(score: number) {
  if (score >= 8) return { badge: 'bg-status-error-light text-status-error', bar: 'bg-status-error' }
  if (score >= 6) return { badge: 'bg-brand-amber-light text-brand-amber', bar: 'bg-brand-amber' }
  return { badge: 'bg-brand-teal-light text-brand-teal', bar: 'bg-brand-teal' }
}

function StatusBadge({ status }: { status: Topic['status'] }) {
  const map = {
    pending: { icon: Clock, label: 'Pending', cls: 'text-brand-amber bg-brand-amber-light' },
    used: { icon: CheckCircle2, label: 'Used', cls: 'text-brand-teal bg-brand-teal-light' },
    archived: { icon: Archive, label: 'Archived', cls: 'text-text-muted bg-surface' },
  }
  const { icon: Icon, label, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', cls)}
      aria-label={`Status: ${label}`}>
      <Icon size={10} aria-hidden="true" />
      {label}
    </span>
  )
}

// ─── score bar ────────────────────────────────────────────────────────────────

interface ScoreData {
  company_impact: number
  company_impact_reason: string
  virality_potential: number
  virality_reason: string
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="h-2 w-full rounded-full bg-border overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  )
}

function ScorePanel({ scores }: { scores: ScoreData }) {
  const companyColor = scores.company_impact >= 75 ? 'bg-brand-teal'
    : scores.company_impact >= 50 ? 'bg-brand-amber' : 'bg-status-error'
  const viralColor = scores.virality_potential >= 75 ? 'bg-brand-teal'
    : scores.virality_potential >= 50 ? 'bg-brand-amber' : 'bg-status-error'

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {/* company impact */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={13} className="text-brand-teal" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-primary">Company Impact</span>
          </div>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            scores.company_impact >= 75 ? 'text-brand-teal'
              : scores.company_impact >= 50 ? 'text-brand-amber' : 'text-status-error'
          )}>
            {Math.round(scores.company_impact)}<span className="text-xs font-normal text-text-muted">/100</span>
          </span>
        </div>
        <ScoreBar value={scores.company_impact} color={companyColor} />
        {scores.company_impact_reason && (
          <p className="text-xs text-text-muted leading-relaxed">
            {scores.company_impact_reason}
          </p>
        )}
      </div>

      {/* virality potential */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-brand-purple" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-primary">Virality Potential</span>
          </div>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            scores.virality_potential >= 75 ? 'text-brand-teal'
              : scores.virality_potential >= 50 ? 'text-brand-amber' : 'text-status-error'
          )}>
            {Math.round(scores.virality_potential)}<span className="text-xs font-normal text-text-muted">/100</span>
          </span>
        </div>
        <ScoreBar value={scores.virality_potential} color={viralColor} />
        {scores.virality_reason && (
          <p className="text-xs text-text-muted leading-relaxed">
            {scores.virality_reason}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── accordion row ────────────────────────────────────────────────────────────

function TopicRow({
  topic, serial, onUse, onArchive, onDelete,
}: {
  topic: Topic
  serial: number
  onUse: (t: Topic) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTopic = useDeleteTopic()
  const [scores, setScores] = useState<ScoreData | null>(
    topic.company_impact > 0 || topic.virality_potential > 0
      ? {
          company_impact: topic.company_impact,
          company_impact_reason: topic.company_impact_reason,
          virality_potential: topic.virality_potential,
          virality_reason: topic.virality_reason,
        }
      : null
  )
  const [loadingScores, setLoadingScores] = useState(false)
  const fetchedRef = useRef(scores !== null) // already have scores → mark as fetched
  const detailId = useId()
  const toggleId = useId()
  const { badge, bar } = priorityColor(topic.priority_score)

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    // Fetch on-demand only if scores aren't stored in DB yet (older topics)
    if (next && !fetchedRef.current) {
      fetchedRef.current = true
      setLoadingScores(true)
      try {
        const res = await api.post<ScoreData>('/api/topics/score', {
          title: topic.title,
          rationale: topic.rationale || '',
          suggested_tone: topic.suggested_tone,
        })
        setScores(res.data)
      } catch {
        // scores just won't show
      } finally {
        setLoadingScores(false)
      }
    }
  }

  return (
    <>
      {/* ── main row ── */}
      <tr
        className={cn(
          'group border-b border-border transition-colors duration-100',
          open ? 'bg-brand-teal-light/20' : serial % 2 === 0 ? 'bg-white' : 'bg-surface/40',
          'hover:bg-brand-teal-light/10 focus-within:bg-brand-teal-light/10',
        )}
      >
        {/* serial */}
        <td className="pl-5 pr-2 py-4 w-[48px] text-center">
          <span className="text-xs font-medium text-text-muted tabular-nums" aria-label={`Row ${serial}`}>
            {serial}
          </span>
        </td>

        {/* priority */}
        <td className="px-2 py-4 w-[80px]">
          <div className="flex items-center gap-2">
            <div className={cn('w-1 h-8 rounded-full shrink-0', bar)} aria-hidden="true" />
            <span className={cn('text-xs font-bold px-2 py-1 rounded-lg tabular-nums', badge)}
              aria-label={`Priority ${topic.priority_score} out of 10`}>
              P{topic.priority_score}
            </span>
          </div>
        </td>

        {/* title + tone */}
        <td className="px-4 py-4">
          <button
            id={toggleId}
            onClick={handleToggle}
            aria-expanded={open}
            aria-controls={detailId}
            className={cn(
              'text-left w-full',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
              'focus-visible:ring-offset-2 rounded-sm',
            )}
          >
            <span className="block text-sm font-semibold text-text-primary leading-snug
              hover:text-brand-teal transition-colors duration-150">
              {topic.title}
            </span>
          </button>
          <span className={cn(
            'mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
            TONE_COLORS[topic.suggested_tone] || 'bg-surface text-text-muted',
          )}>
            {TONE_LABELS[topic.suggested_tone] || topic.suggested_tone}
          </span>
        </td>

        {/* status */}
        <td className="px-4 py-4 w-[110px]">
          <StatusBadge status={topic.status} />
        </td>

        {/* actions */}
        <td className="px-4 py-4 w-[240px]">
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-status-error font-medium whitespace-nowrap">Sure?</span>
                <button
                  onClick={() => deleteTopic.mutate(topic.id)}
                  disabled={deleteTopic.isPending}
                  className="flex items-center gap-1 text-xs font-semibold bg-status-error text-white px-2.5 py-1 rounded-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error"
                >
                  {deleteTopic.isPending ? <Spinner size="sm" /> : <Trash2 size={10} />}
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex items-center gap-0.5 text-xs text-text-muted hover:text-text-primary px-1.5 py-1 rounded-lg hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                >
                  <X size={10} />
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-2"
              >
                {topic.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => onUse(topic)}
                    aria-label={`Generate post for: ${topic.title}`}
                  >
                    <Sparkles size={11} aria-hidden="true" />
                    Generate
                  </Button>
                )}
                {topic.status === 'pending' && (
                  <button
                    onClick={() => onArchive(topic.id)}
                    aria-label={`Archive topic: ${topic.title}`}
                    title="Archive"
                    className={cn(
                      'p-1.5 rounded-lg text-text-muted transition-colors duration-150',
                      'hover:text-brand-amber hover:bg-brand-amber-light',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                    )}
                  >
                    <Archive size={13} aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Delete topic: ${topic.title}`}
                  title="Delete permanently"
                  className={cn(
                    'p-1.5 rounded-lg text-text-muted transition-colors duration-150',
                    'hover:text-status-error hover:bg-status-error-light',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error',
                  )}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </td>

        {/* chevron */}
        <td className="pr-5 py-4 w-[44px]">
          <button
            onClick={handleToggle}
            aria-expanded={open}
            aria-controls={detailId}
            aria-label={open ? `Collapse ${topic.title}` : `Expand ${topic.title}`}
            className={cn(
              'p-1.5 rounded-lg text-text-muted transition-all duration-200',
              'hover:bg-surface hover:text-text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
              open && 'text-brand-teal bg-brand-teal-light',
            )}
          >
            <ChevronDown
              size={15}
              aria-hidden="true"
              className={cn('transition-transform duration-200', open && 'rotate-180')}
            />
          </button>
        </td>
      </tr>

      {/* ── detail row ── */}
      <tr
        id={detailId}
        role="region"
        aria-labelledby={toggleId}
        className={cn('border-b border-border', open ? 'bg-surface/60' : '')}
      >
        <td colSpan={6} className="p-0">
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="detail"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="px-[108px] py-5 space-y-4">
                  {/* rationale */}
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {topic.rationale || 'No rationale provided.'}
                  </p>

                  {/* scores: instant if pre-loaded, on-demand fallback for older topics */}
                  {loadingScores && (
                    <div className="flex items-center gap-2 text-xs text-text-muted py-2" aria-live="polite">
                      <Spinner size="sm" />
                      Running AI analysis…
                    </div>
                  )}
                  {scores && <ScorePanel scores={scores} />}

                  {/* actions in expanded row */}
                  {topic.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => onUse(topic)}
                        aria-label={`Generate LinkedIn post for: ${topic.title}`}
                      >
                        <Sparkles size={12} aria-hidden="true" />
                        Generate post
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onArchive(topic.id)}
                        aria-label={`Archive topic: ${topic.title}`}
                      >
                        <Archive size={12} aria-hidden="true" />
                        Archive
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    </>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const FILTERS: { value: Topic['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'used', label: 'Used' },
  { value: 'archived', label: 'Archived' },
]

export function TopicsPage({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Topic['status']>('pending')
  const { data: topics = [], isLoading } = useTopics(filter)
  const generateTopics = useGenerateTopics()
  const updateTopic = useUpdateTopic()
  const { actions } = useGenerateStore()
  const deleteTopic = useDeleteTopic()

  const handleUse = (topic: Topic) => {
    actions.reset()
    navigate('/', {
      state: {
        prefill: { topic: topic.title, tone: topic.suggested_tone },
        autoGenerate: true,
      },
    })
    updateTopic.mutate({ id: topic.id, status: 'used' })
  }

  const handleArchive = (id: string) => {
    updateTopic.mutate({ id, status: 'archived' })
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title="Topic Ideas"
        onMenuClick={onMenuClick}
        action={
          <Button
            size="sm"
            onClick={() => generateTopics.mutate(6)}
            loading={generateTopics.isPending}
            aria-label="Generate 6 new topic ideas using AI"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Generate new ideas
          </Button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4">

        {/* filter tabs */}
        <div role="tablist" aria-label="Filter topics by status" className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                filter === f.value
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-surface text-text-secondary border border-border hover:bg-white hover:border-border-strong',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {generateTopics.isError && (
          <div role="alert"
            className="bg-status-error-light border border-status-error text-status-error rounded-xl px-4 py-3 text-sm">
            Failed to generate topics — check your backend connection.
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-20" aria-label="Loading topics" aria-live="polite">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && topics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center" role="status">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <Lightbulb size={24} className="text-border" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              {filter === 'pending' ? 'No topic ideas yet' : `No ${filter} topics`}
            </h2>
            {filter === 'pending' && (
              <>
                <p className="text-sm text-text-muted mb-6 max-w-xs">
                  Let the AI suggest what InfinityBox should post about next.
                </p>
                <Button
                  onClick={() => generateTopics.mutate(6)}
                  loading={generateTopics.isPending}
                  aria-label="Generate 6 topic ideas using AI"
                >
                  <Sparkles size={14} aria-hidden="true" />
                  Generate 6 topic ideas
                </Button>
              </>
            )}
          </div>
        )}

        {/* priority legend */}
        {!isLoading && topics.length > 0 && (
          <div className="flex items-center gap-4 text-2xs text-text-muted">
            <span className="font-medium">Priority score:</span>
            <span><span className="font-bold text-status-error">P9–P10</span> = Post this week</span>
            <span><span className="font-bold text-brand-amber">P7–P8</span> = High value</span>
            <span><span className="font-bold text-brand-teal">P1–P6</span> = Lower urgency</span>
          </div>
        )}

        {!isLoading && topics.length > 0 && (
          <div className="rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2">
              <LayoutList size={13} className="text-text-muted" aria-hidden="true" />
              <span className="text-xs text-text-muted font-medium">
                {topics.length} {filter} idea{topics.length !== 1 ? 's' : ''}
                {filter === 'pending' && ' — expand any row to see AI analysis'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse"
                aria-label={`${filter} topic ideas`}
                aria-rowcount={topics.length}
              >
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th scope="col" className="pl-5 pr-2 py-3 w-[48px] text-center">
                      <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">#</span>
                    </th>
                    <th scope="col" className="px-2 py-3 w-[80px]">
                      <span
                        className="text-2xs font-semibold text-text-muted uppercase tracking-widest cursor-help border-b border-dashed border-text-muted"
                        title="AI-assigned priority score out of 10. P9–P10 = must post this week. P7–P8 = high value. P1–P6 = lower urgency."
                      >
                        Priority
                      </span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Topic</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left w-[110px]">
                      <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Status</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left w-[200px]">
                      <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Actions</span>
                    </th>
                    <th scope="col" className="pr-5 py-3 w-[44px]">
                      <span className="sr-only">Expand</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, i) => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      serial={i + 1}
                      onUse={handleUse}
                      onArchive={handleArchive}
                      onDelete={(id) => deleteTopic.mutate(id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
