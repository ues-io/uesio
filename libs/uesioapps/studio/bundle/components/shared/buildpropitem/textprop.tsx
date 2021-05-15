import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"

import { component } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const TextProp: FunctionComponent<PropRendererProps> = ({
	getValue,
	descriptor,
	setValue,
	context,
}) => (
	// Fall back to text component
	<TextField
		value={getValue()}
		label={descriptor.label}
		setValue={setValue}
		variant="io.default"
		context={context}
	/>
)

export default TextProp
