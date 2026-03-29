import { Check, Loader2, Music } from 'lucide-react'
import type { TrackInfo } from '../../../shared/types'
import { formatDuration } from '../../lib/format'
import { cn } from '../../lib/utils'

interface TrackCardProps {
  track: TrackInfo
  percent?: number
  done?: boolean
}

export function TrackCard({ track, percent, done }: TrackCardProps) {
  const showIndicator = percent != null || done

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      {track.thumbnail ? (
        <img
          src={track.thumbnail}
          alt=""
          className="h-12 w-12 rounded object-cover shrink-0"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
          <Music className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {track.author} &middot; {formatDuration(track.duration)}
        </p>
      </div>
      {showIndicator && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("text-xs text-muted-foreground", { "text-green-700": done})}>
            {percent}%
          </span>
          {done ? (
            <Check className="h-4 w-4 text-green-700" />
          ) : (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}
