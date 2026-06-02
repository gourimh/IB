import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { GeneratePage } from './pages/GeneratePage'
import { TopicsPage } from './pages/TopicsPage'
import { LibraryPage } from './pages/LibraryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { PostDetailPage } from './pages/PostDetailPage'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export function App() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* main — full width on mobile, offset on desktop */}
      <main className="flex-1 min-h-screen bg-white w-full lg:ml-[220px]">
        <AnimatePresence>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <GeneratePage onMenuClick={() => setSidebarOpen(true)} />
                </AnimatedPage>
              }
            />
            <Route
              path="/topics"
              element={
                <AnimatedPage>
                  <TopicsPage onMenuClick={() => setSidebarOpen(true)} />
                </AnimatedPage>
              }
            />
            <Route
              path="/library"
              element={
                <AnimatedPage>
                  <LibraryPage onMenuClick={() => setSidebarOpen(true)} />
                </AnimatedPage>
              }
            />
            <Route
              path="/analytics"
              element={
                <AnimatedPage>
                  <AnalyticsPage onMenuClick={() => setSidebarOpen(true)} />
                </AnimatedPage>
              }
            />
            <Route
              path="/posts/:id"
              element={
                <AnimatedPage>
                  <PostDetailPage onMenuClick={() => setSidebarOpen(true)} />
                </AnimatedPage>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
