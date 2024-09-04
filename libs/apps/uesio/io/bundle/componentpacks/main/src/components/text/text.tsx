import { api, definition, component } from "@uesio/ui"
import { AcceptedElements, default as IOText } from "../../utilities/text/text"

type TextDefinition = {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignSetting
}

const Text: definition.UC<TextDefinition> = (props) => {
	const { definition, context } = props
	return (
		<IOText
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			text={definition.text}
			element={definition.element}
			color={definition.color}
			align={definition.align}
			styleTokens={definition[component.STYLE_TOKENS]}
		/>
	)
}

export default Text
