import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export interface GenerateRequest {
  topic: string
  tone: string
  cta: string
  length: string
  include_hashtags: boolean
}

export interface GenerateResponse {
  session_id: string
}

export interface Post {
  id: string
  session_id: string
  topic: string
  tone: string
  cta: string
  length: string
  include_hashtags: boolean
  draft_a: string
  draft_b: string
  final_post: string
  winning_variant: string
  virality_score_a: number
  virality_score_b: number
  critique_a: Record<string, unknown>
  critique_b: Record<string, unknown>
  impressions: number
  reactions: number
  comments: number
  shares: number
  reposts: number
  engagement_score: number
  research_context: string
  created_at: string
  deleted_at: string | null
}

export interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  semantic?: boolean
}

export interface EngagementPayload {
  impressions: number
  reactions: number
  comments: number
  shares: number
  reposts: number
}

export interface RefineRequest {
  post: string
  feedback: string
}

export interface RefineResponse {
  refined_post: string
}

export interface ChatSaveRequest {
  session_id: string
  post_text: string
  topic?: string
}

export interface AnalyticsData {
  total_posts: number
  avg_virality_score: number
  avg_engagement_score: number
  best_tone: string | null
  posts_this_week: number
  posts_this_month: number
  tone_breakdown: Record<string, number>
  top_posts: Post[]
  best_performing_post: Post | null
  score_over_time: Array<{ date: string; score: number }>
}
