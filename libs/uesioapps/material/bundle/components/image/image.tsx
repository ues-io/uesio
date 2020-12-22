import { FunctionComponent } from "react"

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

const Image: FunctionComponent<ImageProps> = (props) => {
	const classes = useStyles(props)
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
