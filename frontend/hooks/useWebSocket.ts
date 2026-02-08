'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [latency, setLatency] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<NodeJS.Timeout>()
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const pingStartRef = useRef<number>(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setStatus('connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectCountRef.current = 0
        onOpen?.()

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingStartRef.current = Date.now()
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle pong for latency calculation
          if (data.type === 'pong') {
            const latencyMs = Date.now() - pingStartRef.current
            setLatency(latencyMs)
          }

          onMessage?.(data)
        } catch {
          onMessage?.(event.data)
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        onClose?.()

        // Clear intervals
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        setStatus('error')
        onError?.(error)
      }
    } catch (error) {
      setStatus('error')
      console.error('WebSocket connection error:', error)
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('disconnected')
  }, [])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (typeof data === 'string') {
        wsRef.current.send(data)
      } else {
        wsRef.current.send(JSON.stringify(data))
      }
      return true
    }
    return false
  }, [])

  const sendBinary = useCallback((data: Blob | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
      return true
    }
    return false
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    latency,
    connect,
    disconnect,
    sendMessage,
    sendBinary,
  }
}
