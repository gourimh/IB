import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { type NodeStatusValue } from '../../store/generateStore'

interface NodeStatusProps {
  label: string
  status: NodeStatusValue
}

export function NodeStatus({ label, status }: NodeStatusProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        layout
        animate={
          status === 'running'
            ? { scale: [1, 1.04, 1], transition: { duration: 0.8, repeat: Infinity } }
            : status === 'complete'
            ? { scale: [1, 1.08, 1], transition: { type: 'spring', stiffness: 400, damping: 20 } }
            : { scale: 1 }
        }
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
          status === 'pending' && 'border-border bg-white',
          status === 'running' && 'border-brand-amber bg-brand-amber-light',
          status === 'complete' && 'border-brand-teal bg-brand-teal'
        )}
      >
        {status === 'complete' && <Check size={12} className="text-white" />}
        {status === 'running' && (
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-brand-amber"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        {status === 'pending' && (
          <div className="w-2 h-2 rounded-full bg-border" />
        )}
      </motion.div>
      <span
        className={cn(
          'text-2xs font-medium whitespace-nowrap',
          status === 'pending' && 'text-text-muted',
          status === 'running' && 'text-brand-amber',
          status === 'complete' && 'text-brand-teal'
        )}
      >
        {label}
      </span>
    </div>
  )
}
