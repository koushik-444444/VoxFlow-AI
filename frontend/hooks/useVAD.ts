import { useEffect } from 'react'
import { useMicVAD } from '@ricky0123/vad-react'
import { useStore } from '@/store/useStore'

export function useVAD() {
  const wsStatus = useStore((s) => s.wsStatus)
  const isVADEnabled = useStore((s) => s.isVADEnabled)
  const setVADStatus = useStore((s) => s.setVADStatus)

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechStart: () => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      console.log('[VAD] Speech started')
      if (state.isPlaying) {
        state.stopAudio()
        state.sendInterrupt()
      }
      
      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      state.setIsRecording(true)
    },
    onSpeechEnd: () => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      console.log('[VAD] Speech ended')
      state.setIsRecording(false)
      state.setIsTranscribing(true)
      
      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'end_of_speech' }))
      }
    },
    onFrameProcessed: (probs: { isSpeech: number; notSpeech: number }, frame: Float32Array) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      if (probs.isSpeech > 0.5) {
        // Convert the Float32Array frame to a Blob safely.
        const blob = new Blob([frame as any], { type: 'application/octet-stream' })
        state.sendAudioChunk(blob)
      }
    },
    workletURL: '/vad.worklet.bundle.js',
    modelURL: '/silero_vad.onnx',
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.4,
    minSpeechFrames: 3,
    preSpeechPadFrames: 5,
  } as any)

  useEffect(() => {
    if (vad.loading) {
      setVADStatus('loading')
    } else if (vad.errored) {
      console.error('[VAD] Hook error:', vad.errored)
      setVADStatus('error')
    } else if (isVADEnabled && wsStatus === 'connected') {
      setVADStatus('active')
      // Only start if not already listening
      if (!vad.listening) {
        vad.start()
      }
    } else {
      setVADStatus('idle')
      if (vad.listening) {
        vad.pause()
      }
    }
  }, [vad.loading, vad.errored, vad.listening, isVADEnabled, wsStatus])

  return vad
}
