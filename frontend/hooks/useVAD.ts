import { useEffect } from 'react'
import { useMicVAD } from '@ricky0123/vad-react'
import { useStore } from '@/store/useStore'
import { toast } from '@/components/ui/Toaster'

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
  view.setUint32(16, 16, true)       // chunk size
  view.setUint16(20, 1, true)        // PCM format
  view.setUint16(22, 1, true)        // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true)        // block align
  view.setUint16(34, 16, true)       // bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

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
    onSpeechEnd: (audio: Float32Array) => {
      const state = useStore.getState()
      if (!state.isVADEnabled || state.wsStatus !== 'connected') return

      console.log('[VAD] Speech ended, encoding', audio.length, 'samples as WAV')
      state.setIsRecording(false)
      state.setIsTranscribing(true)

      // Encode the complete speech segment as WAV and send it
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

      // Drive the waveform visualizer with real-time speech probability
      if (probs.isSpeech > 0.3) {
        // Compute RMS level from the frame for the audio level indicator
        let sum = 0
        for (let i = 0; i < frame.length; i++) {
          sum += frame[i] * frame[i]
        }
        const rms = Math.sqrt(sum / frame.length)
        const level = Math.min(rms * 5, 1) // scale up for visibility
        state.setAudioLevel(level)
      }
    },
    // These are the actual recognized properties in @ricky0123/vad-web@0.0.30:
    // - model: 'v5' | 'legacy' (default 'legacy') -> selects silero_vad_v5.onnx or silero_vad_legacy.onnx
    // - baseAssetPath: prepended to the hardcoded model + worklet filenames
    // - onnxWASMBasePath: path for ONNX Runtime WASM files
    // NOTE: 'modelURL' and 'workletURL' are NOT recognized and are silently ignored.
    model: 'v5',
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    ortConfig: (ort: any) => {
      ort.env.wasm.wasmPaths = '/'
    },
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.4,
    minSpeechFrames: 3,
    preSpeechPadFrames: 5,
  } as any)

  useEffect(() => {
    if (vad.loading) {
      setVADStatus('loading')
    } else if (vad.errored) {
      const errMsg = typeof vad.errored === 'object' ? (vad.errored as any).message : String(vad.errored)
      console.error('[VAD] Hook error:', vad.errored)
      if (isVADEnabled) {
        toast.error(`Hands-Free Error: ${errMsg}`)
      }
      setVADStatus('error')
    } else if (isVADEnabled && wsStatus === 'connected') {
      setVADStatus('active')
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
