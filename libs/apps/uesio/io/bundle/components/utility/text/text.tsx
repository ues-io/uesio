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

type AcceptedElements =
	| "p"
	| "span"
	| "h2"
	| "h1"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "pre"

const acceptedElements = [
	"p",
	"span",
	"h2",
	"h1",
	"h3",
	"h4",
	"h5",
	"h6",
	"pre",
]

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
	const Tag = (
		element && acceptedElements.includes(element) ? element : "span"
	) as AcceptedElements
	const mergedText = props.context.merge(text)
	return <Tag className={classes.root}>{mergedText}</Tag>
}

export default Text
