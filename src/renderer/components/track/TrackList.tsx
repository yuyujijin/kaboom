import type { TrackInfo } from '../../../shared/types'
import { TrackCard } from './TrackCard'

interface TrackListProps {
  tracks: { info: TrackInfo; percent?: number; done?: boolean }[]
  outputDir: string | null
}

export function TrackList({ tracks, outputDir }: TrackListProps) {
  if (tracks.length === 0) return null

  return (
    <div className="w-full space-y-1.5">
      {tracks.map((track, i) => (
        <TrackCard
          key={i}
          track={track.info}
          percent={track.percent}
          done={track.done}
          filePath={outputDir && track.done ? `${outputDir}/${track.info.title}.mp3` : undefined}
        />
      ))}
    </div>
  )
}
