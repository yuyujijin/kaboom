import { AlertTriangle, Clock, XCircle } from 'lucide-react'
import type { DownloadProgress } from '../../../shared/types'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

interface DownloadStatusProps {
  status: DownloadProgress
}

export function DownloadStatus({ status }: DownloadStatusProps) {
  const isRateLimited = status.rateLimitedAt != null

  return (
    <div className="w-full space-y-3">
      {/* Track counter for playlists */}
      {status.total != null && (
        <p className="text-sm text-muted-foreground">
          Track {status.current} of {status.total}
        </p>
      )}

      {/* Progress bar */}
      {status.percent != null && (
        <div className="w-full bg-secondary rounded-full h-1">
          <div
            className="bg-primary h-1 rounded-full"
            style={{ width: `${status.percent}%` }}
          />
        </div>
      )}

      {/* Rate limit banner */}
      {isRateLimited && (
        <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertTitle>SoundCloud is slowing us down</AlertTitle>
          <AlertDescription>
            Too many requests — waiting before retrying. Attempt{' '}
            <span className="font-medium">
              {status.retryAttempt} of {status.maxRetries}
            </span>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Non-fatal warning banner */}
      {status.warning != null && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{status.warning}</AlertDescription>
        </Alert>
      )}

      {/* Error banner */}
      {status.status === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Download failed</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
