'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecorderOptions {
  onDataAvailable?: (data: Blob) => void
  onError?: (error: Error) => void
  chunkInterval?: number
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onDataAvailable, onError, chunkInterval = 100 } = options

  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })
      streamRef.current = stream

      // Set up audio context for visualization
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start audio level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const monitorAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalized = Math.min(average / 128, 1)
        setAudioLevel(normalized)
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
      }
      monitorAudioLevel()

      // Set up media recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      
      console.log('Using mimeType:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onDataAvailable) {
          onDataAvailable(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        const err = new Error('MediaRecorder error')
        setError(err)
        onError?.(err)
      }

      // Start recording with chunks
      mediaRecorder.start(chunkInterval)
      setIsRecording(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording')
      setError(error)
      onError?.(error)
    }
  }, [onDataAvailable, onError, chunkInterval])

  const stopRecording = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
