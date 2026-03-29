import type { TrackInfo } from '../../../shared/types'
import { TrackCard } from './TrackCard'

interface TrackListProps {
  tracks: { info: TrackInfo; percent?: number }[]
  allDone?: boolean
}

export function TrackList({ tracks, allDone }: TrackListProps) {
  if (tracks.length === 0) return null

  return (
    <div className="w-full space-y-1.5">
      {tracks.map((track, i) => (
        <TrackCard key={i} track={track.info} percent={track.percent} allDone={allDone} />
      ))}
    </div>
  )
}
