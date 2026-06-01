import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming: boolean
}

interface ChatState {
  sessionId: string
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  actions: {
    initSession: (id: string) => void
    addUserMessage: (content: string) => void
    startAssistantMessage: () => string
    appendToken: (id: string, token: string) => void
    finalizeMessage: (id: string) => void
    setError: (msg: string | null) => void
    clearMessages: () => void
  }
}

function makeId() {
  return crypto.randomUUID()
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: '',
  messages: [],
  isStreaming: false,
  error: null,

  actions: {
    initSession: (id) => set({ sessionId: id }),

    addUserMessage: (content) =>
      set((s) => ({
        messages: [...s.messages, { id: makeId(), role: 'user', content, isStreaming: false }],
        error: null,
      })),

    startAssistantMessage: () => {
      const id = makeId()
      set((s) => ({
        isStreaming: true,
        messages: [...s.messages, { id, role: 'assistant', content: '', isStreaming: true }],
      }))
      return id
    },

    appendToken: (id, token) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, content: m.content + token } : m
        ),
      })),

    finalizeMessage: (id) =>
      set((s) => ({
        isStreaming: false,
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, isStreaming: false } : m
        ),
      })),

    setError: (msg) => set({ error: msg, isStreaming: false }),

    clearMessages: () => set({ messages: [], error: null }),
  },
}))
