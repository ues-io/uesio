import { FC } from "react"

import { ImageProps } from "./imagedefinition"
import { hooks, styles } from "@uesio/ui"

const Image: FC<ImageProps> = (props) => {
	const { definition } = props

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
				textAlign: definition?.align || "left",
				maxWidth: "100%",
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
	const fileFullName = definition?.file
	console.log("Definitely!", definition)
	// if (!fileFullName) {
	// 	return null
	// }

	// const fileUrl = uesio.file.getURLFromFullName(context, fileFullName)

	const fileUrl = "https://picsum.photos/200/300"
	return (
		<div
			className={classes.root}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		>
			<picture>
				<source srcSet={fileUrl} media="(min-width: 800px)" />
				<img
					className={classes.inner}
					src={fileUrl}
					loading={definition.loading}
					alt={definition.alt}
				/>
			</picture>
		</div>
	)
}

export default Image
