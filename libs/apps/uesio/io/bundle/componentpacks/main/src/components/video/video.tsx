import { api, styles, signal, definition } from "@uesio/ui"

type VideoDefinition = {
	file?: string
	src?: string
	height?: string
	width?: string
	muted?: boolean
	autoplay?: boolean
	loop?: boolean
	signals?: signal.SignalDefinition[]
}

interface VideoProps extends definition.BaseProps {
	definition: VideoDefinition
}

const Video: definition.UesioComponent<VideoProps> = (props) => {
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
				width={definition.width}
				autoPlay={definition.autoplay || false}
				muted={definition.muted || false}
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

/*
const VideoPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Video",
	description: "Display a video.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "file",
			type: "METADATA",
			metadataType: "FILE",
			label: "File",
		},
		{
			name: "src",
			type: "TEXT",
			label: "url",
		},
		{
			name: "height",
			type: "TEXT",
			label: "Height",
		},
		{
			name: "width",
			type: "TEXT",
			label: "Width",
		},
		{
			name: "muted",
			type: "BOOLEAN",
			label: "Muted",
		},
		{
			name: "loop",
			type: "BOOLEAN",
			label: "Loop",
		},
		{
			name: "autoplay",
			type: "BOOLEAN",
			label: "Auto play",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root", "inner"],
	type: "component",
	category: "CONTENT",
}
*/

export default Video
