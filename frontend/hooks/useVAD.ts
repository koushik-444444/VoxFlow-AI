import { useEffect } from 'react'
import { useMicVAD } from '@ricky0123/vad-react'
import { utils } from '@ricky0123/vad-web'
import { useStore } from '@/store/useStore'
import { toast } from '@/components/ui/Toaster'

export function useVAD() {
  const wsStatus = useStore((s) => s.wsStatus)
  const wsConnection = useStore((s) => s.wsConnection)
  const sendAudioChunk = useStore((s) => s.sendAudioChunk)
  const isVADEnabled = useStore((s) => s.isVADEnabled)
  const isPlaying = useStore((s) => s.isPlaying)
  const stopAudio = useStore((s) => s.stopAudio)
  const sendInterrupt = useStore((s) => s.sendInterrupt)
  const setIsRecording = useStore((s) => s.setIsRecording)
  const setIsTranscribing = useStore((s) => s.setIsTranscribing)

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechStart: () => {
      // Don't act if VAD is disabled or WS not connected
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      console.log('Speech started')
      // Implementation of Interruption: If AI is speaking, stop it.
      if (state.isPlaying) {
        state.stopAudio()
        state.sendInterrupt()
      }
      
      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      state.setIsRecording(true)
    },
    onSpeechEnd: (audio) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      console.log('Speech ended')
      state.setIsRecording(false)
      state.setIsTranscribing(true)
      
      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'end_of_speech' }))
      }
    },
    onFrameProcessed: (probs, frame) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      // Send audio frames to the server if speech is detected
      if (probs.isSpeech > 0.5) {
        // Convert SharedArrayBuffer to a standard Blob compatible format if needed
        const blob = new Blob([frame as any], { type: 'application/octet-stream' })
        state.sendAudioChunk(blob)
      }
    }
  })

  // Control VAD state based on settings
  useEffect(() => {
    if (isVADEnabled && wsStatus === 'connected') {
      vad.pause() // Reset/Ensure it starts fresh if needed or just use start/pause
      vad.start()
    } else {
      vad.pause()
    }
  }, [isVADEnabled, wsStatus])

  return vad
}
