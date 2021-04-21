import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextProps extends definition.UtilityProps {
	text?: string
	element?: string
}

const Link: FunctionComponent<TextProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	const { text, element } = props
	const mergedText = props.context.merge(text)
	if (element === "div") {
		return <div className={classes.root}>{mergedText}</div>
	}
	return <span className={classes.root}>{mergedText}</span>
}

export default Link
