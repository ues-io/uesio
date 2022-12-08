import { FC } from "react"

import { VideoProps } from "./videodefinition"
import { hooks, styles } from "@uesio/ui"

const Video: FC<VideoProps> = (props) => {
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
	const uesio = hooks.useUesio(props)

	return (
		<div
			className={classes.root}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
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
							? uesio.file.getURLFromFullName(
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
