import { FunctionComponent } from "react"

import { component, builder } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const NumberProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<TextField
		value={valueAPI.get(path)}
		label={descriptor.label}
		setValue={(value: string): void =>
			valueAPI.set(path, parseInt(value, 10))
		}
		context={context}
	/>
)

export default NumberProp
