import { FunctionComponent } from "react"

import { TextProps } from "./textdefinition"
import IOText from "../../utility/io.text/text"

const Text: FunctionComponent<TextProps> = (props) => {
	const { definition, context } = props
	return (
		<IOText
			{...props}
			context={context}
			text={definition.text}
			element={definition.element}
		/>
	)
}

export default Text
