import { Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

const RETRY_SLEEP_MS = 600_000 // must match RETRY_SLEEP_SECONDS in downloader.ts

interface RateLimitAlertProps {
  rateLimitedAt: number
  retryAttempt?: number
  maxRetries?: number
}

export function RateLimitAlert({ rateLimitedAt, retryAttempt, maxRetries }: RateLimitAlertProps) {
  const retryAt = new Date(rateLimitedAt + RETRY_SLEEP_MS)
  const retryIsFuture = retryAt > new Date()
  const isActive = retryAttempt != null && maxRetries != null

  return (
    <Alert variant="warning">
      <Clock className="h-4 w-4" />
      <AlertTitle>SoundCloud is slowing us down</AlertTitle>
      <AlertDescription>
        {isActive ? (
          <>
            Auto-retrying — attempt{' '}
            <span className="font-medium">{retryAttempt} of {maxRetries}</span>
            {retryIsFuture && (
              <> at <span className="font-medium">{retryAt.toLocaleTimeString()}</span></>
            )}
            .
          </>
        ) : (
          <>
            Too many requests last session.{' '}
            {retryIsFuture
              ? <>You can try again after <span className="font-medium">{retryAt.toLocaleTimeString()}</span>.</>
              : <>The cooldown has passed — safe to try again.</>}
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
