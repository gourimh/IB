import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—'
  return score.toFixed(1)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function charCount(text: string): number {
  return text.length
}

export function getWinnerScore(post: {
  virality_score_a?: number
  virality_score_b?: number
  winning_variant?: string
}): number {
  if (post.winning_variant === 'A') return post.virality_score_a ?? 0
  if (post.winning_variant === 'B') return post.virality_score_b ?? 0
  return Math.max(post.virality_score_a ?? 0, post.virality_score_b ?? 0)
}
