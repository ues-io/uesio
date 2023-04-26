import { definition, styles } from "@uesio/ui"
import { forwardRef } from "react"

type AlignValues = "start" | "end" | "left" | "right" | "center" | "justify"

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

interface TextProps extends definition.UtilityProps {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignValues
}

const Text = forwardRef<HTMLDivElement, TextProps>((props, ref) => {
	const { text, element, color, align } = props
	const classes = styles.useUtilityStyleTokens(
		{
			root: [color && `text-[${color}]`, align && `text-[${align}]`],
		},
		props,
		"uesio/io.text"
	)
	// The `as "div"` here is a hack to get typescript to not complain.
	const Tag = (element ? element : "span") as "div"
	const mergedText = props.context.mergeString(text)
	return (
		<Tag ref={ref} className={classes.root}>
			{mergedText}
		</Tag>
	)
})

export type { AcceptedElements }

export default Text
