import { useEffect, useRef, useState } from 'react'
import { WS_BASE } from '../lib/api'
import { useGenerateStore } from '../store/generateStore'

export function useWebSocket(sessionId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const MAX_RETRIES = 3

  const { updateNodeStatus, appendToken, setScores, setComplete, setError } =
    useGenerateStore((s) => s.actions)

  useEffect(() => {
    if (!sessionId) return

    let closed = false

    const connect = (attempt: number) => {
      const url = `${WS_BASE}/api/stream/${sessionId}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        retriesRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          switch (msg.type) {
            case 'node_start':
              updateNodeStatus(msg.node, 'running')
              break
            case 'token':
              appendToken(msg.content)
              break
            case 'node_complete':
              updateNodeStatus(msg.node, 'complete')
              break
            case 'scores':
              setScores(msg.data)
              break
            case 'complete':
              closed = true
              setComplete(msg.post_id, msg.final_post)
              setIsConnected(false)
              ws.close()
              break
            case 'error':
              closed = true
              setError(msg.message)
              setIsConnected(false)
              ws.close()
              break
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onerror = () => {
        setIsConnected(false)
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (!closed && attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000
          setTimeout(() => connect(attempt + 1), delay)
        }
      }
    }

    connect(0)

    return () => {
      closed = true
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [sessionId, updateNodeStatus, appendToken, setScores, setComplete, setError])

  return { isConnected }
}
