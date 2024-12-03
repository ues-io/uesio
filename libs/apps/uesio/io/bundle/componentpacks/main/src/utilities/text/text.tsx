import { definition, styles } from "@uesio/ui"
import { forwardRef } from "react"

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
	align?: AlignSetting
}

const Text = forwardRef<HTMLDivElement, TextProps>((props, ref) => {
	const { text, element = "span", color, align, context, id } = props
	const classes = styles.useUtilityStyleTokens(
		{
			root: [],
		},
		props,
		"uesio/io.text"
	)
	// The `as "div"` here is a hack to get typescript to not complain.
	const Tag = element as "div"
	const mergedText = context.mergeString(text)
	return (
		<Tag
			ref={ref}
			className={styles.process(
				undefined,
				classes.root,
				color && `text-[color:${context.mergeString(color)}]`,
				align && `text-${align}`
			)}
			id={id}
		>
			{mergedText}
		</Tag>
	)
})

export type { AcceptedElements }

export default Text
