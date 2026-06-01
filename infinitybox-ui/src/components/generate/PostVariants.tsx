import { motion } from 'framer-motion'
import { ScoreRing } from '../ui/ScoreRing'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface PostVariantsProps {
  optimisedA: string
  optimisedB: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B'
  onSelectVariant?: (variant: 'A' | 'B') => void
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function VariantCard({
  label,
  text,
  score,
  isWinner,
  onSelect,
}: {
  label: string
  text: string
  score: number
  isWinner: boolean
  onSelect?: () => void
}) {
  return (
    <motion.div
      variants={item}
      className={cn(
        'bg-white border rounded-xl p-5 flex flex-col gap-3 transition-shadow',
        isWinner ? 'border-brand-teal shadow-[0_0_0_2px_rgba(29,158,117,0.15)]' : 'border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-md',
              isWinner
                ? 'bg-brand-teal text-white'
                : 'bg-surface text-text-muted'
            )}
          >
            Draft {label}
          </span>
          {isWinner && (
            <Badge variant="winner" className="text-2xs">
              Winner
            </Badge>
          )}
        </div>
        <ScoreRing score={score} size={52} strokeWidth={4} />
      </div>

      <div className="prose-linkedin text-text-secondary overflow-y-auto max-h-[280px] text-xs leading-relaxed">
        {text || <span className="text-text-muted italic">No draft available</span>}
      </div>

      {onSelect && (
        <Button
          variant={isWinner ? 'primary' : 'secondary'}
          size="sm"
          onClick={onSelect}
          className="self-start"
        >
          Use this
        </Button>
      )}
    </motion.div>
  )
}

export function PostVariants({
  optimisedA,
  optimisedB,
  scoreA,
  scoreB,
  winner,
  onSelectVariant,
}: PostVariantsProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-widest">
        Generated variants
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VariantCard
          label="A"
          text={optimisedA}
          score={scoreA}
          isWinner={winner === 'A'}
          onSelect={onSelectVariant ? () => onSelectVariant('A') : undefined}
        />
        <VariantCard
          label="B"
          text={optimisedB}
          score={scoreB}
          isWinner={winner === 'B'}
          onSelect={onSelectVariant ? () => onSelectVariant('B') : undefined}
        />
      </div>
    </motion.div>
  )
}
