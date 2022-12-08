import { FC } from "react"

import { ImageProps } from "./imagedefinition"
import { hooks, styles } from "@uesio/ui"

const Image: FC<ImageProps> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
				textAlign: definition?.align || "left",
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
			<img
				className={classes.inner}
				src={
					definition.file
						? uesio.file.getURLFromFullName(
								context,
								definition.file
						  )
						: context.mergeString(definition.src)
				}
				loading={definition.loading}
				alt={definition.alt}
			/>
		</div>
	)
}

export default Image
