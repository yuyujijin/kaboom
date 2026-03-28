import type { TrackInfo } from '../../../shared/types'
import { TrackCard } from './TrackCard'

interface TrackListProps {
  tracks: TrackInfo[]
}

export function TrackList({ tracks }: TrackListProps) {
  if (tracks.length === 0) return null

  return (
    <div className="w-full space-y-1.5">
      {tracks.map((track, i) => (
        <TrackCard key={i} track={track} />
      ))}
    </div>
  )
}
