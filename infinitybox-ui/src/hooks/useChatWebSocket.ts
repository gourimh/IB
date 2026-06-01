import { useEffect, useRef, useCallback } from 'react'
import { WS_BASE } from '../lib/api'
import { useChatStore } from '../store/chatStore'

export function useChatWebSocket(sessionId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const activeMessageId = useRef<string | null>(null)
  const retryCount = useRef(0)
  const intentionalClose = useRef(false)
  const { actions } = useChatStore()

  const connect = useCallback(() => {
    if (!sessionId) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_BASE}/api/chat/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      retryCount.current = 0
      actions.setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'token':
            if (activeMessageId.current) {
              actions.appendToken(activeMessageId.current, msg.content)
            }
            break
          case 'done':
            if (activeMessageId.current) {
              actions.finalizeMessage(activeMessageId.current)
              activeMessageId.current = null
            }
            break
          case 'error':
            actions.setError(msg.message || 'Something went wrong')
            activeMessageId.current = null
            break
          case 'cleared':
            actions.clearMessages()
            break
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (intentionalClose.current) return
      retryCount.current += 1
      const delay = Math.min(retryCount.current * 1500, 8000)
      setTimeout(() => {
        if (!intentionalClose.current) connect()
      }, delay)
    }

    ws.onerror = () => {
      // Only show error after the first retry so page load doesn't flash an error
      if (retryCount.current > 0) {
        actions.setError('Cannot reach the backend — make sure the server is running.')
      }
    }
  }, [sessionId, actions])

  useEffect(() => {
    intentionalClose.current = false
    connect()
    return () => {
      intentionalClose.current = true
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback(
    (text: string) => {
      const send = () => {
        actions.addUserMessage(text)
        const id = actions.startAssistantMessage()
        activeMessageId.current = id
        wsRef.current!.send(JSON.stringify({ type: 'message', message: text }))
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        send()
      } else {
        // wait for connection then send
        const ws = wsRef.current
        if (ws) {
          ws.addEventListener('open', send, { once: true })
        }
      }
    },
    [actions]
  )

  const clearChat = useCallback(() => {
    actions.clearMessages()
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }))
    }
  }, [actions])

  return { sendMessage, clearChat }
}
