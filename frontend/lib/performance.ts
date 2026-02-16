export interface PerformanceMetrics {
  ttft: number | null; // Time to First Token (ms)
  speechToText: number | null; // VAD end to Transcription (ms)
  llmLatency: number | null; // Transcription to First LLM token (ms)
  totalResponseTime: number | null; // Speech end to Audio play (ms)
  vadTriggerTime: number | null; // Voice start to VAD detection (ms)
}

class PerformanceMonitor {
  private startTime: Record<string, number> = {}
  private metrics: PerformanceMetrics = {
    ttft: null,
    speechToText: null,
    llmLatency: null,
    totalResponseTime: null,
    vadTriggerTime: null,
  }

  start(label: string) {
    this.startTime[label] = performance.now()
  }

  end(label: string): number | null {
    if (!this.startTime[label]) return null
    const duration = performance.now() - this.startTime[label]
    delete this.startTime[label]
    return duration
  }

  recordMetric(key: keyof PerformanceMetrics, value: number) {
    this.metrics[key] = Math.round(value)
  }

  getMetrics() {
    return { ...this.metrics }
  }

  reset() {
    this.metrics = {
      ttft: null,
      speechToText: null,
      llmLatency: null,
      totalResponseTime: null,
      vadTriggerTime: null,
    }
  }
}

export const perfMonitor = new PerformanceMonitor()
