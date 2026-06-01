export const TONE_OPTIONS = [
  { value: 'thought-leadership', label: 'Thought Leadership' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'data-driven', label: 'Data-Driven' },
  { value: 'contrarian', label: 'Contrarian' },
  { value: 'listicle', label: 'Listicle' },
]

export const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short', chars: '900–1,100' },
  { value: 'medium', label: 'Medium', chars: '1,300–1,600' },
  { value: 'long', label: 'Long', chars: '1,600–1,900' },
]

export const NODE_LABELS: Record<string, string> = {
  context_loader: 'Context',
  research_node: 'Research',
  draft_node: 'Draft',
  critique_node: 'Critique',
  optimise_node: 'Optimise',
  score_node: 'Score',
  save_node: 'Save',
}

export const NODE_ORDER = [
  'context_loader',
  'research_node',
  'draft_node',
  'critique_node',
  'optimise_node',
  'score_node',
  'save_node',
]

export const TONE_COLORS: Record<string, string> = {
  'thought-leadership': 'bg-brand-teal-light text-brand-teal',
  storytelling: 'bg-brand-purple-light text-brand-purple',
  'data-driven': 'bg-brand-amber-light text-brand-amber',
  contrarian: 'bg-status-error-light text-status-error',
  listicle: 'bg-surface text-text-secondary',
}
