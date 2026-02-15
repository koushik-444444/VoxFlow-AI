'use client'

import { useVAD } from '@/hooks/useVAD'

export function VADManager() {
  // Simply initialize the hook. It handles global store updates and 
  // interaction logic (like interruptions) automatically.
  useVAD()
  
  return null
}
