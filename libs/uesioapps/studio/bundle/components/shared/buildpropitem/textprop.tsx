import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"

import { component } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const TextProp: FunctionComponent<PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	// Fall back to text component
	<TextField
		value={valueAPI.get(path)}
		label={descriptor.label}
		setValue={(value: string) => valueAPI.set(path, value)}
		context={context}
	/>
)

export default TextProp
