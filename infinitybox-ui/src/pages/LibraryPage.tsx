import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { SearchBar } from '../components/library/SearchBar'
import { FilterBar } from '../components/library/FilterBar'
import { PostCard } from '../components/library/PostCard'
import { Spinner } from '../components/ui/Spinner'
import { usePosts } from '../hooks/usePosts'

export function LibraryPage() {
  const [tone, setTone] = useState('all')
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [isSemantic, setIsSemantic] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts(
    tone === 'all' ? undefined : tone,
    activeSearch || undefined
  )

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    if (!value) {
      setActiveSearch('')
      setIsSemantic(false)
    }
  }

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setActiveSearch(search)
      setIsSemantic(!!search)
    }
  }

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const total = data?.pages[0]?.total ?? 0

  return (
    <div>
      <TopBar title="Post library" />
      <div className="p-6 lg:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1" onKeyDown={handleSearchSubmit}>
            <SearchBar value={search} onChange={handleSearch} semantic={isSemantic} />
          </div>
        </div>

        <FilterBar activeFilter={tone} onChange={setTone} />

        {total > 0 && (
          <p className="text-xs text-text-muted">
            {total} post{total !== 1 ? 's' : ''}
            {isSemantic ? ' — semantic results' : ''}
          </p>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post, i) => {
            const isLast = i === posts.length - 1
            return (
              <div key={post.id} ref={isLast ? lastCardRef : undefined}>
                <PostCard post={post} index={i % 20} />
              </div>
            )
          })}
        </div>

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}
      </div>
    </div>
  )
}
