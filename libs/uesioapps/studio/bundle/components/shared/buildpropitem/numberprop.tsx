import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"

import { component } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const NumberProp: FunctionComponent<PropRendererProps> = ({
	descriptor,
	setValue,
	getValue,
	context,
}) => (
	<TextField
		value={getValue()}
		label={descriptor.label}
		setValue={(value: string): void => setValue(parseInt(value, 10))}
		variant="io.default"
		context={context}
	/>
)

export default NumberProp
