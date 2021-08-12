import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextProps extends definition.UtilityProps {
	text?: string
	element?: string
	color?: string
	align?: string
}

const Text: FunctionComponent<TextProps> = (props) => {
	const { text, element, color, align } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(color && {
					color: props.context.merge(color),
				}),
				verticalAlign: "inherit",
				//...(align && { textAlign: align }),
				textAlign: align ? align : "start",
			},
		},
		props
	)

	const mergedText = props.context.merge(text)
	if (element === "div") {
		return <div className={classes.root}>{mergedText}</div>
	}
	return <span className={classes.root}>{mergedText}</span>
}

export default Text
