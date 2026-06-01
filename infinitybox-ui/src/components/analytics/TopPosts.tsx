import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatDate, getWinnerScore } from '../../lib/utils'
import { truncate } from '../../lib/utils'
import type { Post } from '../../lib/api'

interface TopPostsProps {
  posts: Post[]
}

export function TopPosts({ posts }: TopPostsProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Top posts by engagement</h3>
      {posts.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No engagement data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 text-xs text-text-muted font-medium">Topic</th>
                <th className="text-left pb-2 text-xs text-text-muted font-medium">Tone</th>
                <th className="text-right pb-2 text-xs text-text-muted font-medium">Virality</th>
                <th className="text-right pb-2 text-xs text-text-muted font-medium">Engagement</th>
                <th className="text-right pb-2 text-xs text-text-muted font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-surface transition-colors"
                >
                  <td className="py-3 pr-3 text-text-primary font-medium max-w-[200px]">
                    {truncate(post.topic, 50)}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge variant="tone" tone={post.tone}>
                      {(post.tone || '').replace('-', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <span className="text-brand-amber font-semibold">
                      {getWinnerScore(post).toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <span className="text-brand-teal font-semibold">
                      {post.engagement_score > 0 ? post.engagement_score.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-text-muted text-xs">
                    {formatDate(post.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
