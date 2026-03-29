import noiseTexture from '../../assets/noise-light.png'

export function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url(${noiseTexture})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '75px 75px',
        opacity: .2,
      }}
    />
  )
}
