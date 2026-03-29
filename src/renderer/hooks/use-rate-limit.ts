import { useEffect, useState } from 'react'
import { useLocalStorage } from './local-storage'
import type { DownloadProgress } from '../../shared/types'

const RATE_LIMIT_KEY = 'soundcloud-rate-limit'
const RATE_LIMIT_DURATION = 600_000

type RateLimitData = Pick<DownloadProgress, 'rateLimitedAt' | 'retryAttempt' | 'maxRetries'>

export function useRateLimit(loading: boolean) {
  const { value: rateLimit, setValue: setRateLimit } = useLocalStorage<RateLimitData>(RATE_LIMIT_KEY)

  const isActive = () => {
    if (loading || rateLimit == null) return false
    if (Date.now() >= rateLimit.rateLimitedAt! + RATE_LIMIT_DURATION) {
      setRateLimit(undefined)
      return false
    }
    return true
  }

  const [isRateLimited, setIsRateLimited] = useState(isActive)

  useEffect(() => {
    const active = isActive()
    setIsRateLimited(active)
    if (!active) return
    const id = setInterval(() => {
      const still = isActive()
      setIsRateLimited(still)
      if (!still) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [rateLimit, loading])

  return { isRateLimited, rateLimit, setRateLimit }
}
