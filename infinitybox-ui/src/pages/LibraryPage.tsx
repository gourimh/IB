import { useState, useRef, useCallback, useId, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronDown, ExternalLink, Trash2, X,
  Layers, LayoutList, ChevronRight,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { SearchBar } from '../components/library/SearchBar'
import { FilterBar } from '../components/library/FilterBar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { cn, formatDate, getWinnerScore, truncate } from '../lib/utils'
import { usePosts, useDeletePost } from '../hooks/usePosts'
import type { Post } from '../lib/api'

// ─── single post row ──────────────────────────────────────────────────────────

function PostRow({ post, serial }: { post: Post; serial: number }) {
  const navigate = useNavigate()
  const deletePost = useDeletePost()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const detailId = useId()
  const score = getWinnerScore(post)

  return (
    <>
      <tr className={cn(
        'group border-b border-border transition-colors duration-100',
        open ? 'bg-brand-teal-light/10' : serial % 2 === 0 ? 'bg-white' : 'bg-surface/30',
        'hover:bg-brand-teal-light/5',
      )}>
        {/* serial */}
        <td className="pl-4 pr-2 py-3 w-[40px] text-center hidden sm:table-cell">
          <span className="text-xs text-text-muted tabular-nums">{serial}</span>
        </td>

        {/* tone */}
        <td className="px-3 py-3 w-[130px] hidden md:table-cell">
          <Badge variant="tone" tone={post.tone}>
            {(post.tone || '').replace(/-/g, ' ')}
          </Badge>
        </td>

        {/* topic */}
        <td className="px-3 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <button
            aria-expanded={open}
            aria-controls={detailId}
            className="text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded-sm"
          >
            <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide truncate max-w-[200px] sm:max-w-xs md:max-w-none">
              {post.topic}
            </p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1 hidden sm:block">
              {truncate(post.final_post, 100)}
            </p>
          </button>
          <div className="mt-1 md:hidden">
            <Badge variant="tone" tone={post.tone}>
              {(post.tone || '').replace(/-/g, ' ')}
            </Badge>
          </div>
        </td>

        {/* score */}
        <td className="px-3 py-3 w-[72px] text-center hidden sm:table-cell">
          {score > 0 && (
            <span className={cn(
              'text-xs font-bold tabular-nums',
              score >= 80 ? 'text-brand-teal' : score >= 65 ? 'text-brand-amber' : 'text-text-muted',
            )}>
              {score.toFixed(0)}
            </span>
          )}
        </td>

        {/* date */}
        <td className="px-3 py-3 w-[160px] hidden lg:table-cell">
          <span className="text-xs text-text-muted whitespace-nowrap">{formatDate(post.created_at)}</span>
        </td>

        {/* actions */}
        <td className="pr-3 py-3 w-[110px]">
          <div className="flex items-center justify-end gap-1">
            {!confirmDelete ? (
              <>
                <button
                  onClick={() => navigate(`/posts/${post.id}`)}
                  aria-label="View post"
                  title="View"
                  className="p-1.5 rounded-lg text-text-muted hover:text-brand-teal hover:bg-brand-teal-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                >
                  <ExternalLink size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                  aria-label="Delete post"
                  title="Delete"
                  className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error-light transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error"
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => deletePost.mutate(post.id)}
                  disabled={deletePost.isPending}
                  className="text-2xs font-semibold bg-status-error text-white px-2 py-1 rounded-lg hover:opacity-90 focus-visible:outline-none"
                >
                  {deletePost.isPending ? '…' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls={detailId}
              aria-label={open ? 'Collapse' : 'Expand'}
              className={cn(
                'p-1.5 rounded-lg text-text-muted transition-all duration-150',
                'hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                open && 'text-brand-teal bg-brand-teal-light',
              )}
            >
              <ChevronDown size={13} className={cn('transition-transform duration-200', open && 'rotate-180')} />
            </button>
          </div>
        </td>
      </tr>

      {/* expanded detail */}
      <tr id={detailId} className={open ? 'bg-surface/50 border-b border-border' : ''}>
        <td colSpan={6} className="p-0">
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="detail"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="px-4 sm:px-8 py-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 lg:hidden text-xs text-text-muted">
                    {score > 0 && <span className="font-semibold text-brand-amber">Score {score.toFixed(0)}</span>}
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <p className="prose-linkedin text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {post.final_post}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => navigate(`/posts/${post.id}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-teal bg-brand-teal-light px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <ExternalLink size={12} />
                      View full details
                    </button>
                    {post.engagement_score > 0 && (
                      <span className="text-xs text-text-muted">
                        Engagement: <strong className="text-brand-teal">{post.engagement_score.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    </>
  )
}

// ─── topic group (grouped view) ───────────────────────────────────────────────

function TopicGroupRows({ topic, posts, startSerial }: {
  topic: string
  posts: Post[]
  startSerial: number
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      {/* group header row */}
      <tr className="bg-surface border-b border-border">
        <td colSpan={6} className="px-4 py-2.5">
          <button
            onClick={() => setExpanded(o => !o)}
            aria-expanded={expanded}
            className="flex items-center gap-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded-sm"
          >
            <ChevronRight size={13} className={cn(
              'text-text-muted transition-transform duration-150 shrink-0',
              expanded && 'rotate-90',
            )} />
            <span className="text-xs font-semibold text-text-primary truncate">{topic}</span>
            <span className="shrink-0 ml-1 text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-brand-purple-light text-brand-purple">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </button>
        </td>
      </tr>

      {/* post rows */}
      <AnimatePresence initial={false}>
        {expanded && posts.map((post, i) => (
          <PostRow key={post.id} post={post} serial={startSerial + i} />
        ))}
      </AnimatePresence>
    </>
  )
}

// ─── table shell ─────────────────────────────────────────────────────────────

function PostTable({ children, total }: { children: React.ReactNode; total: number }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]" aria-label="Post library" aria-rowcount={total}>
          <thead>
            <tr className="bg-surface border-b border-border">
              <th scope="col" className="pl-4 pr-2 py-3 w-[40px] hidden sm:table-cell">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">#</span>
              </th>
              <th scope="col" className="px-3 py-3 text-left w-[130px] hidden md:table-cell">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Tone</span>
              </th>
              <th scope="col" className="px-3 py-3 text-left">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Topic</span>
              </th>
              <th scope="col" className="px-3 py-3 text-center w-[72px] hidden sm:table-cell">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Score</span>
              </th>
              <th scope="col" className="px-3 py-3 text-left w-[160px] hidden lg:table-cell">
                <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Date & Time</span>
              </th>
              <th scope="col" className="pr-3 py-3 w-[110px]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

type ViewMode = 'flat' | 'grouped'

export function LibraryPage({ onMenuClick }: { onMenuClick?: () => void }) {
  const [tone, setTone] = useState('all')
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [isSemantic, setIsSemantic] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('flat')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLTableRowElement | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(
    tone === 'all' ? undefined : tone,
    activeSearch || undefined
  )

  const lastRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      sentinelRef.current = node
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const handleSearch = (v: string) => {
    setSearch(v)
    if (!v) { setActiveSearch(''); setIsSemantic(false) }
  }
  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { setActiveSearch(search); setIsSemantic(!!search) }
  }

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const total = data?.pages[0]?.total ?? 0

  // group posts by topic for grouped view
  const groupedByTopic = useMemo(() => {
    const groups = new Map<string, Post[]>()
    posts.forEach((post) => {
      const key = (post.topic || 'Untitled').trim()
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(post)
    })
    return Array.from(groups.entries()).sort(
      ([, a], [, b]) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
    )
  }, [posts])

  const uniqueTopics = groupedByTopic.length
  const duplicateCount = posts.length - uniqueTopics

  return (
    <div>
      <TopBar title="Post library" onMenuClick={onMenuClick} />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">

        {/* search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1" onKeyDown={handleSearchSubmit}>
            <SearchBar value={search} onChange={handleSearch} semantic={isSemantic} />
          </div>

          {/* flat / grouped toggle */}
          <div role="group" aria-label="View mode" className="flex items-center border border-border rounded-xl overflow-hidden bg-white shrink-0">
            <button
              onClick={() => setViewMode('flat')}
              aria-pressed={viewMode === 'flat'}
              aria-label="Flat list"
              title="Flat list"
              className={cn(
                'p-2.5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal',
                viewMode === 'flat' ? 'bg-brand-teal text-white' : 'text-text-muted hover:bg-surface',
              )}
            >
              <LayoutList size={15} aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              aria-pressed={viewMode === 'grouped'}
              aria-label="Group by topic"
              title="Group by topic"
              className={cn(
                'p-2.5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal',
                viewMode === 'grouped' ? 'bg-brand-teal text-white' : 'text-text-muted hover:bg-surface',
              )}
            >
              <Layers size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <FilterBar activeFilter={tone} onChange={setTone} />

        {/* stats */}
        {total > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span>{total} post{total !== 1 ? 's' : ''}{isSemantic ? ' — semantic results' : ''}</span>
            {viewMode === 'grouped' && duplicateCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-brand-purple-light text-brand-purple font-medium">
                {uniqueTopics} unique topic{uniqueTopics !== 1 ? 's' : ''} · {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''} grouped
              </span>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}

        {!isLoading && posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <BookOpen size={40} className="text-border mb-4" />
            <h3 className="text-base font-semibold text-text-primary mb-1">No posts yet</h3>
            <p className="text-sm text-text-muted">Generate your first one.</p>
          </motion.div>
        )}

        {/* ── flat table ── */}
        {viewMode === 'flat' && posts.length > 0 && (
          <PostTable total={total}>
            {posts.map((post, i) => (
              <PostRow key={post.id} post={post} serial={i + 1} />
            ))}
            <tr ref={lastRowRef}><td colSpan={6} className="p-0" /></tr>
          </PostTable>
        )}

        {/* ── grouped table ── */}
        {viewMode === 'grouped' && posts.length > 0 && (
          <PostTable total={total}>
            {(() => {
              let serial = 1
              return groupedByTopic.map(([topic, topicPosts]) => {
                const start = serial
                serial += topicPosts.length
                return (
                  <TopicGroupRows
                    key={topic}
                    topic={topic}
                    posts={topicPosts}
                    startSerial={start}
                  />
                )
              })
            })()}
            <tr ref={lastRowRef}><td colSpan={6} className="p-0" /></tr>
          </PostTable>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}
      </div>
    </div>
  )
}
