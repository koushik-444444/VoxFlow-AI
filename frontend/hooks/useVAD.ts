import { useEffect } from 'react'
import { useMicVAD } from '@ricky0123/vad-react'
import { useStore } from '@/store/useStore'
import { toast } from '@/components/ui/Toaster'
import { perfMonitor } from '@/lib/performance'
import { triggerHaptic, updateThemeMood } from '@/lib/ux'

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function encodeWAV(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const numSamples = samples.length
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

function getSensitivityThresholds(sensitivity: 'quiet' | 'normal' | 'sensitive') {
  switch (sensitivity) {
    case 'quiet':
      return { positiveSpeechThreshold: 0.5, negativeSpeechThreshold: 0.35 }
    case 'sensitive':
      return { positiveSpeechThreshold: 0.7, negativeSpeechThreshold: 0.5 }
    default:
      return { positiveSpeechThreshold: 0.6, negativeSpeechThreshold: 0.4 }
  }
}

function classifyVADError(error: any): { message: string; action: string } {
  const errorStr = String(error?.message || error).toLowerCase()
  
  if (errorStr.includes('permission') || errorStr.includes('not allowed')) {
    return { 
      message: 'Microphone access denied', 
      action: 'Please allow microphone access in your browser settings' 
    }
  }
  if (errorStr.includes('not found') || errorStr.includes('no device')) {
    return { 
      message: 'No microphone found', 
      action: 'Please connect a microphone and refresh' 
    }
  }
  if (errorStr.includes('wasm') && (errorStr.includes('fetch') || errorStr.includes('load') || errorStr.includes('404'))) {
    return { 
      message: 'VAD assets failed to load', 
      action: 'Check your internet connection and refresh' 
    }
  }
  if (errorStr.includes('not supported') || errorStr.includes('wasm')) {
    return { 
      message: 'Voice Engine not supported', 
      action: 'Try updating your browser or use Chrome/Edge' 
    }
  }
  if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return { 
      message: 'Failed to load VAD model', 
      action: 'Check your internet connection and refresh' 
    }
  }
  return { 
    message: 'Voice detection error', 
    action: 'Try refreshing the page' 
  }
}

export function useVAD() {
  const wsStatus = useStore((s) => s.wsStatus)
  const isVADEnabled = useStore((s) => s.isVADEnabled)
  const setVADStatus = useStore((s) => s.setVADStatus)
  const setVADError = useStore((s) => s.setVADError)
  const vadSensitivity = useStore((s) => s.vadSensitivity)
  
  const thresholds = getSensitivityThresholds(vadSensitivity)

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechStart: () => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected' || state.recordingType === 'manual') return

      console.log('[VAD] Speech started')
      triggerHaptic(20)
      updateThemeMood('creative')
      perfMonitor.reset()
      perfMonitor.start('total_response')
      perfMonitor.start('speech_to_text')
      state.setVADError(null)
      
      if (state.isPlaying) {
        state.stopAudio()
        state.sendInterrupt()
      }

      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      state.setRecordingType('vad')
      state.setIsRecording(true)
    },
    onSpeechEnd: (audio: Float32Array) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected' || state.recordingType !== 'vad') return

      console.log('[VAD] Speech ended, encoding', audio.length, 'samples as WAV')
      triggerHaptic([10, 30, 10])
      updateThemeMood('calm')
      state.setIsRecording(false)
      state.setRecordingType('none')
      state.setIsTranscribing(true)

      const wavBuffer = encodeWAV(audio, 16000)
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })
      state.sendAudioChunk(wavBlob)

      if (state.wsConnection && state.wsStatus === 'connected') {
        state.wsConnection.send(JSON.stringify({ type: 'end_of_speech' }))
      }
    },
    onFrameProcessed: (probs: { isSpeech: number; notSpeech: number }, frame: Float32Array) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      if (probs.isSpeech > 0.3) {
        let sum = 0
        for (let i = 0; i < frame.length; i++) {
          sum += frame[i] * frame[i]
        }
        const rms = Math.sqrt(sum / frame.length)
        const level = Math.min(rms * 5, 1)
        state.setAudioLevel(level)
      }
    },
    model: 'v5',
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    ortConfig: (ort: any) => {
      // Use defaults but ensure wasmPaths is a string directory
      ort.env.wasm.numThreads = 1
      ort.env.wasm.wasmPaths = '/'
    },
    positiveSpeechThreshold: thresholds.positiveSpeechThreshold,
    negativeSpeechThreshold: thresholds.negativeSpeechThreshold,
    minSpeechFrames: 3,
    preSpeechPadFrames: 5,
  } as any)

  useEffect(() => {
    if (vad.loading) {
      setVADStatus('loading')
      setVADError(null)
    } else if (vad.errored) {
      const errorMsg = (vad.errored as any) instanceof Error ? (vad.errored as any).message : String(vad.errored)
      console.error('[VAD] Raw Hook error:', vad.errored)
      console.log('[VAD] Error String:', errorMsg)
      
      const classified = classifyVADError(vad.errored)
      setVADStatus('error')
      setVADError(`${classified.message}: ${classified.action}`)
      if (isVADEnabled) {
        toast.error(`Hands-Free Error: ${classified.message}`)
      }
    } else if (isVADEnabled && wsStatus === 'connected') {
      setVADStatus('active')
      setVADError(null)
      if (!vad.listening) {
        vad.start().catch((err: any) => {
          console.error('[VAD] Start failed:', err)
          const classified = classifyVADError(err)
          setVADStatus('error')
          setVADError(classified.message)
        })
      }
    } else {
      setVADStatus('idle')
      if (vad.listening) {
        vad.pause()
      }
    }
  }, [vad.loading, vad.errored, vad.listening, isVADEnabled, wsStatus, setVADStatus, setVADError])

  return vad
}
