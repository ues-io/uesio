import { styles, definition } from "@uesio/ui"
import { AcceptedElements, default as IOText } from "../../utilities/text/text"

type TextDefinition = {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignSetting
}

const Text: definition.UC<TextDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOText
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			text={definition.text}
			element={definition.element}
			color={definition.color}
			align={definition.align}
		/>
	)
}

export default Text
