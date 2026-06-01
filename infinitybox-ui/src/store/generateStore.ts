import { create } from 'zustand'

export type NodeStatusValue = 'pending' | 'running' | 'complete'
export type GenerateStatus = 'idle' | 'pending' | 'streaming' | 'complete' | 'error'

interface ScoreData {
  score_a: number
  score_b: number
  winner: 'A' | 'B'
  optimised_a?: string
  optimised_b?: string
}

interface GenerateState {
  sessionId: string | null
  status: GenerateStatus
  nodeStatuses: Record<string, NodeStatusValue>
  streamedText: string
  draftA: string
  draftB: string
  optimisedA: string
  optimisedB: string
  scoreA: number | null
  scoreB: number | null
  winner: 'A' | 'B' | null
  finalPost: string
  postId: string | null
  error: string | null
  actions: {
    startGeneration: (sessionId: string) => void
    updateNodeStatus: (node: string, status: NodeStatusValue) => void
    appendToken: (token: string) => void
    setScores: (data: ScoreData) => void
    setComplete: (postId: string, finalPost: string) => void
    setError: (msg: string) => void
    reset: () => void
  }
}

const INITIAL_NODE_STATUSES: Record<string, NodeStatusValue> = {
  context_loader: 'pending',
  research_node: 'pending',
  draft_node: 'pending',
  critique_node: 'pending',
  optimise_node: 'pending',
  score_node: 'pending',
  save_node: 'pending',
}

export const useGenerateStore = create<GenerateState>((set) => ({
  sessionId: null,
  status: 'idle',
  nodeStatuses: { ...INITIAL_NODE_STATUSES },
  streamedText: '',
  draftA: '',
  draftB: '',
  optimisedA: '',
  optimisedB: '',
  scoreA: null,
  scoreB: null,
  winner: null,
  finalPost: '',
  postId: null,
  error: null,

  actions: {
    startGeneration: (sessionId) =>
      set({
        sessionId,
        status: 'pending',
        nodeStatuses: { ...INITIAL_NODE_STATUSES },
        streamedText: '',
        draftA: '',
        draftB: '',
        optimisedA: '',
        optimisedB: '',
        scoreA: null,
        scoreB: null,
        winner: null,
        finalPost: '',
        postId: null,
        error: null,
      }),

    updateNodeStatus: (node, status) =>
      set((state) => ({
        status: 'streaming',
        nodeStatuses: { ...state.nodeStatuses, [node]: status },
      })),

    appendToken: (token) =>
      set((state) => ({ streamedText: state.streamedText + token })),

    setScores: (data) =>
      set({
        scoreA: data.score_a,
        scoreB: data.score_b,
        winner: data.winner as 'A' | 'B',
        optimisedA: data.optimised_a || '',
        optimisedB: data.optimised_b || '',
      }),

    setComplete: (postId, finalPost) =>
      set({
        postId,
        finalPost,
        status: 'complete',
      }),

    setError: (msg) =>
      set({ status: 'error', error: msg }),

    reset: () =>
      set({
        sessionId: null,
        status: 'idle',
        nodeStatuses: { ...INITIAL_NODE_STATUSES },
        streamedText: '',
        draftA: '',
        draftB: '',
        optimisedA: '',
        optimisedB: '',
        scoreA: null,
        scoreB: null,
        winner: null,
        finalPost: '',
        postId: null,
        error: null,
      }),
  },
}))
