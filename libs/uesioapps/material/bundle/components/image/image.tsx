import React, { ReactElement } from "react"

import { ImageProps } from "./imagedefinition"
import { hooks, material, styles } from "@uesio/ui"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: ImageProps) => ({
			display: "block",
			textAlign: props.definition?.align || "left",
			lineHeight: 0,
			cursor: props.definition?.signals ? "pointer" : "",
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		inner: (props: ImageProps) => ({
			display: "inline-block",
			height: props.definition?.height,
		}),
	})
)

function Image(props: ImageProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const fileFullName = props.definition?.file

	const ImageProps = {
		className: classes.root,
		onClick:
			props.definition?.signals &&
			uesio.signal.getHandler(props.definition.signals),
	}

	if (fileFullName) {
		const fileUrl = uesio.file.getURLFromFullName(
			props.context,
			fileFullName
		)
		return (
			<div {...ImageProps}>
				<img className={classes.inner} src={fileUrl}></img>
			</div>
		)
	}
	return null
}

export default Image
