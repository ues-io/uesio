import { api, styles, signal, definition } from "@uesio/ui"

type VideoDefinition = {
  autoplay?: boolean
  controls?: boolean
  file?: string
  height?: number
  loop?: boolean
  muted?: boolean
  playsinline?: boolean
  signals?: signal.SignalDefinition[]
  src?: string
  width?: number
}

const Video: definition.UC<VideoDefinition> = (props) => {
  const { definition, context } = props
  const {
    autoplay = false,
    controls = true,
    file,
    height,
    loop = false,
    muted = false,
    playsinline = false,
    signals,
    src,
    width,
  } = definition

  const classes = styles.useStyleTokens(
    {
      root: [
        height !== undefined && `h-[${height}px]`,
        width !== undefined && `w-[${width}px]`,
      ],
    },
    props,
  )

  return (
    <video
      className={classes.root}
      loop={loop}
      controls={controls}
      height={height}
      width={width}
      autoPlay={autoplay}
      muted={muted}
      playsInline={playsinline}
      onClick={signals && api.signal.getHandler(signals, context)}
    >
      <source
        src={
          file
            ? api.file.getURLFromFullName(context, file)
            : context.mergeString(src)
        }
      />
      Your browser does not support the video tag.
    </video>
  )
}

export default Video
