export {}

declare global {
  interface Window {
    storage?: {
      get(key: string, shared?: boolean): Promise<{ value: string } | null>
      set(key: string, value: string, shared?: boolean): Promise<void>
    }
  }
}
