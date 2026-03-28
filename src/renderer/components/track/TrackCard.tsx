import { Music } from 'lucide-react'
import type { TrackInfo } from '../../../shared/types'
import { formatDuration } from '../../lib/format'

interface TrackCardProps {
  track: TrackInfo
}

export function TrackCard({ track }: TrackCardProps) {
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
    </div>
  )
}
