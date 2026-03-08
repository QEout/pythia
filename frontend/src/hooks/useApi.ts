import { useState, useCallback } from 'react'

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async (options?: RequestInit) => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(url, options)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setData(d)
      return d as T
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [url])

  return { data, loading, error, fetch: fetch_, setData }
}
