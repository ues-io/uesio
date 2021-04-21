import { FunctionComponent } from "react"

import { ImageProps } from "./imagedefinition"
import { hooks, styles } from "@uesio/ui"

const Image: FunctionComponent<ImageProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				display: "block",
				textAlign: props.definition?.align || "left",
				lineHeight: 0,
				cursor: props.definition?.signals ? "pointer" : "",
			},
			inner: {
				display: "inline-block",
				height: props.definition?.height,
			},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const fileFullName = props.definition?.file

	if (!fileFullName) {
		return null
	}

	const fileUrl = uesio.file.getURLFromFullName(props.context, fileFullName)
	return (
		<div
			className={classes.root}
			onClick={
				props.definition?.signals &&
				uesio.signal.getHandler(props.definition.signals)
			}
		>
			<img className={classes.inner} src={fileUrl} />
		</div>
	)
}

export default Image
