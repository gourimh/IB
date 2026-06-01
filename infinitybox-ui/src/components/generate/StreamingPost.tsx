import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { NODE_LABELS } from '../../lib/constants'
import { type NodeStatusValue } from '../../store/generateStore'

interface StreamingPostProps {
  text: string
  nodeStatuses: Record<string, NodeStatusValue>
}

function getCurrentNodeLabel(nodeStatuses: Record<string, NodeStatusValue>): string {
  const running = Object.entries(nodeStatuses).find(([, v]) => v === 'running')
  if (running) return `${NODE_LABELS[running[0]] || running[0]}…`
  return 'Processing…'
}

export function StreamingPost({ text, nodeStatuses }: StreamingPostProps) {
  const currentLabel = getCurrentNodeLabel(nodeStatuses)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-5">
        <div className="prose-linkedin text-text-primary min-h-[80px]">
          {text}
          {text && <span className="cursor-blink" />}
          {!text && (
            <span className="text-text-muted italic text-sm">Generating post content…</span>
          )}
        </div>
      </Card>
      <p className="mt-2 text-xs text-text-muted px-1">{currentLabel}</p>
    </motion.div>
  )
}
