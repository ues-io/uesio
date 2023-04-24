import { api, styles, signal, definition } from "@uesio/ui"

type VideoDefinition = {
	file?: string
	src?: string
	controls?: boolean
	width?: string
	height?: string
	muted?: boolean
	autoplay?: boolean
	playsinline?: boolean
	loop?: boolean
	signals?: signal.SignalDefinition[]
}

const Video: definition.UC<VideoDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	return (
		<video
			className={classes.root}
			loop={definition.loop || false}
			controls={definition.controls || true}
			height={definition.height}
			width={definition.width}
			autoPlay={definition.autoplay || false}
			muted={definition.muted || false}
			playsInline={definition.playsinline || false}
			onClick={
				definition?.signals &&
				api.signal.getHandler(definition.signals, context)
			}
		>
			<source
				src={
					definition.file
						? api.file.getURLFromFullName(context, definition.file)
						: context.mergeString(definition.src)
				}
			/>
			Your browser does not support the video tag.
		</video>
	)
}

export default Video
