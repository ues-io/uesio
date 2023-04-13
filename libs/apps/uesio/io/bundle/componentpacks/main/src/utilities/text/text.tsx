import { definition, styles } from "@uesio/ui"

type AlignValues =
	| "start"
	| "end"
	| "left"
	| "right"
	| "center"
	| "justify"
	| "match-parent"
	| "inherit"

type AcceptedElements =
	| "p"
	| "span"
	| "div"
	| "h2"
	| "h1"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "pre"

interface TextProps {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignValues
}

const Text: definition.UtilityComponent<TextProps> = (props) => {
	const { text, element, color, align } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(color && {
					color: props.context.mergeString(color),
				}),
				textAlign: align,
				verticalAlign: "inherit",
			},
		},
		props,
		"uesio/io.text"
	)
	const Tag = (element ? element : "span") as AcceptedElements
	const mergedText = props.context.mergeString(text)
	return <Tag className={classes.root}>{mergedText}</Tag>
}

export type { AcceptedElements }

export default Text
