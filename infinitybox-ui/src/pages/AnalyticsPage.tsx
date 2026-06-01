import { TopBar } from '../components/layout/TopBar'
import { StatsRow } from '../components/analytics/StatsRow'
import { ToneChart } from '../components/analytics/ToneChart'
import { ScoreChart } from '../components/analytics/ScoreChart'
import { TopPosts } from '../components/analytics/TopPosts'
import { Spinner } from '../components/ui/Spinner'
import { useAnalytics } from '../hooks/useAnalytics'

export function AnalyticsPage() {
  const { data, isLoading, error } = useAnalytics()

  return (
    <div>
      <TopBar title="Analytics" />
      <div className="p-6 lg:p-8 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        {error && (
          <div className="bg-status-error-light border border-status-error text-status-error rounded-xl px-4 py-3 text-sm">
            Failed to load analytics
          </div>
        )}
        {data && (
          <>
            <StatsRow data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ToneChart data={data.tone_breakdown} />
              <ScoreChart data={data.score_over_time} />
            </div>
            <TopPosts posts={data.top_posts} />
          </>
        )}
      </div>
    </div>
  )
}
