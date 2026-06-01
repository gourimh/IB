import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { formatDate, truncate, getWinnerScore } from '../../lib/utils'
import type { Post } from '../../lib/api'

interface PostCardProps {
  post: Post
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const navigate = useNavigate()
  const score = getWinnerScore(post)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={() => navigate(`/posts/${post.id}`)}
      className="group bg-white border border-border rounded-xl p-5 cursor-pointer
        transition-all duration-200 hover:shadow-card-hover hover:-translate-y-[1px]"
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="tone" tone={post.tone}>
          {(post.tone || '').replace('-', ' ')}
        </Badge>
        <span className="text-xs text-text-muted">{formatDate(post.created_at)}</span>
      </div>

      <p className="text-2xs font-semibold text-brand-teal uppercase tracking-wide mb-2 truncate">
        {post.topic}
      </p>

      <p className="prose-linkedin text-text-secondary text-[12px] leading-relaxed line-clamp-4">
        {truncate(post.final_post, 180)}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {score > 0 && (
            <Badge variant="score">Score: {score.toFixed(0)}</Badge>
          )}
          {post.engagement_score > 0 && (
            <Badge variant="engagement">Eng: {post.engagement_score.toFixed(1)}</Badge>
          )}
        </div>
        <span className="text-xs text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-medium">
          View →
        </span>
      </div>
    </motion.div>
  )
}
