import { useState, useEffect, useRef } from 'react'

export function useInstantLoad<T>(
  queryKey: string,
  fetchFn: () => Promise<T>,
  options = { timeout: 3000 }
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setIsLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Load timeout')), options.timeout)
        )

        const dataPromise = fetchFn()
        const result = await Promise.race([dataPromise, timeoutPromise])
        
        if (mounted.current) {
          setData(result)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted.current) {
          setError(err as Error)
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted.current = false
    }
  }, [queryKey, fetchFn, options.timeout])

  return { data, isLoading, error }
}