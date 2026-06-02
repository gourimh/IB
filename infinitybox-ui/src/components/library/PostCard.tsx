import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'
import { formatDate, truncate, getWinnerScore } from '../../lib/utils'
import { useDeletePost } from '../../hooks/usePosts'
import { cn } from '../../lib/utils'
import type { Post } from '../../lib/api'

interface PostCardProps {
  post: Post
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const navigate = useNavigate()
  const deletePost = useDeletePost()
  const [confirming, setConfirming] = useState(false)
  const score = getWinnerScore(post)

  const handleCardClick = () => {
    if (confirming) return
    navigate(`/posts/${post.id}`)
  }

  const handleTrashClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deletePost.mutate(post.id)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white border rounded-xl p-5 transition-all duration-200',
        confirming
          ? 'border-status-error cursor-default'
          : 'border-border cursor-pointer hover:shadow-card-hover hover:-translate-y-[1px]',
      )}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="tone" tone={post.tone}>
          {(post.tone || '').replace('-', ' ')}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{formatDate(post.created_at)}</span>
          {!confirming && (
            <button
              onClick={handleTrashClick}
              aria-label={`Delete post: ${post.topic}`}
              className={cn(
                'p-1 rounded-lg transition-all duration-150',
                'opacity-0 group-hover:opacity-100',
                'text-text-muted hover:text-status-error hover:bg-status-error-light',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error focus-visible:opacity-100',
              )}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* topic */}
      <p className="text-2xs font-semibold text-brand-teal uppercase tracking-wide mb-2 truncate">
        {post.topic}
      </p>

      {/* post preview */}
      <p className="prose-linkedin text-text-secondary text-[12px] leading-relaxed line-clamp-4">
        {truncate(post.final_post, 180)}
      </p>

      {/* footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {score > 0 && <Badge variant="score">Score: {score.toFixed(0)}</Badge>}
          {post.engagement_score > 0 && (
            <Badge variant="engagement">Eng: {post.engagement_score.toFixed(1)}</Badge>
          )}
        </div>
        {!confirming && (
          <span className="text-xs text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-medium">
            View →
          </span>
        )}
      </div>

      {/* inline delete confirmation — slides up from bottom */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 rounded-b-xl bg-status-error-light border-t border-status-error px-5 py-3 flex items-center justify-between"
          >
            <span className="text-xs text-status-error font-medium">
              Delete this post permanently?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmDelete}
                disabled={deletePost.isPending}
                className="flex items-center gap-1 text-xs font-semibold bg-status-error text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-status-error"
              >
                {deletePost.isPending ? <Spinner size="sm" /> : <Trash2 size={11} />}
                Delete
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary px-2 py-1.5 rounded-lg hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
              >
                <X size={11} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
