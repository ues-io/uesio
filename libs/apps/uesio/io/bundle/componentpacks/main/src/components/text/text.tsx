import { api, component, styles, definition } from "@uesio/ui"
import { AcceptedElements, default as IOText } from "../../utilities/text/text"

type TextDefinition = {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignSetting
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Text: definition.UC<TextDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOText
			id={api.component.getComponentIdFromProps(props)}
			classes={classes}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			text={definition.text}
			element={definition.element}
			color={definition.color}
			align={definition.align}
		/>
	)
}

export default Text
