declare module 'aos' {
  interface AosOptions {
    duration?: number
    easing?: string
    once?: boolean
    mirror?: boolean
    offset?: number
    delay?: number
    anchorPlacement?: string
    startEvent?: string
    disable?: string | boolean | (()=>boolean)
    throttleDelay?: number
    debounceDelay?: number
    disableMutationObserver?: boolean
  }
  
  interface Aos {
    init: (options?: AosOptions) => void
    refresh: () => void
    refreshHard: () => void
  }
  
  const aos: Aos
  export default aos
} 