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

	// Might be a bit verbose since we're only giving these options in propsdef
	const acceptedElements = [
		"p",
		"span",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"pre",
	]
	const tag =
		props.element && acceptedElements.includes(props.element)
			? props.element
			: "span"

	const CustomTag = `${tag}` as keyof JSX.IntrinsicElements
	const mergedText = props.context.merge(text)

	return <CustomTag className={classes.root}>{mergedText}</CustomTag>
}

export default Text
