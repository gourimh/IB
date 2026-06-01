import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { GeneratePage } from './pages/GeneratePage'
import { LibraryPage } from './pages/LibraryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { PostDetailPage } from './pages/PostDetailPage'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

export function App() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen bg-white">
        <AnimatePresence>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <GeneratePage />
                </AnimatedPage>
              }
            />
            <Route
              path="/library"
              element={
                <AnimatedPage>
                  <LibraryPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/analytics"
              element={
                <AnimatedPage>
                  <AnalyticsPage />
                </AnimatedPage>
              }
            />
            <Route
              path="/posts/:id"
              element={
                <AnimatedPage>
                  <PostDetailPage />
                </AnimatedPage>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
