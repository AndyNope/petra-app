import { useEffect, useRef, useCallback } from 'react'

/**
 * Fuehrt eine Funktion in einem definierten Intervall aus.
 * Der Timer wird zurueckgesetzt, wenn sich `fn` oder `interval` aendern.
 */
export function usePolling(fn, interval = 10000, enabled = true) {
  const savedFn = useRef(fn)
  useEffect(() => { savedFn.current = fn }, [fn])

  useEffect(() => {
    if (!enabled) return
    savedFn.current()
    const id = setInterval(() => savedFn.current(), interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}
