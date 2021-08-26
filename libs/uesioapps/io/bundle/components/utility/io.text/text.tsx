import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface TextProps extends definition.UtilityProps {
	text?: string
	element?: string
	color?: string
	align?:
		| "start"
		| "end"
		| "left"
		| "right"
		| "center"
		| "justify"
		| "match-parent"
		| "inherit"
}

const Text: FunctionComponent<TextProps> = (props) => {
	const { text, element, color, align } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(color && {
					color: props.context.merge(color),
				}),
				textAlign: align,
				verticalAlign: "inherit",
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
