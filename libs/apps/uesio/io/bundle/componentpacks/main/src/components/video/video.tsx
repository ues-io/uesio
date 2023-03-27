import { api, styles, signal, definition } from "@uesio/ui"

type VideoDefinition = {
	file?: string
	src?: string
	height?: string
	controls?: boolean
	width?: string
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
			root: {
				display: "block",
				lineHeight: 0,
				cursor: definition?.signals ? "pointer" : "",
			},
			inner: {
				display: "inline-block",
				height: definition?.height,
			},
		},
		props
	)

	return (
		<div
			className={classes.root}
			onClick={
				definition?.signals &&
				api.signal.getHandler(definition.signals, context)
			}
		>
			<video
				loop={definition.loop || false}
				height={definition.height}
				controls={definition.controls || true}
				width={definition.width}
				autoPlay={definition.autoplay || false}
				muted={definition.muted || false}
				playsInline={definition.playsinline || false}
			>
				<source
					src={
						definition.file
							? api.file.getURLFromFullName(
									context,
									definition.file
							  )
							: context.mergeString(definition.src)
					}
				/>
				Your browser does not support the video tag.
			</video>
		</div>
	)
}

export default Video
