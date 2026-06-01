import { motion } from 'framer-motion'
import { NodeStatus } from '../ui/NodeStatus'
import { NODE_ORDER, NODE_LABELS } from '../../lib/constants'
import { type NodeStatusValue } from '../../store/generateStore'

interface AgentPipelineProps {
  nodeStatuses: Record<string, NodeStatusValue>
}

export function AgentPipeline({ nodeStatuses }: AgentPipelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-surface rounded-xl border border-border p-4"
    >
      <p className="text-2xs text-text-muted uppercase tracking-widest mb-4 font-medium">
        Agent pipeline
      </p>
      <div className="flex items-start justify-between gap-2">
        {NODE_ORDER.map((nodeKey, i) => (
          <div key={nodeKey} className="flex items-center gap-2 flex-1">
            <NodeStatus label={NODE_LABELS[nodeKey]} status={nodeStatuses[nodeKey] || 'pending'} />
            {i < NODE_ORDER.length - 1 && (
              <div
                className={`flex-1 h-px mt-[-10px] transition-colors duration-300 ${
                  nodeStatuses[nodeKey] === 'complete' ? 'bg-brand-teal' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
