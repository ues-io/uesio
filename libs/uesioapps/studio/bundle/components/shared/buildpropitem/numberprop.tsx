import { FunctionComponent } from "react"

import { component, builder } from "@uesio/ui"

const NumberField = component.registry.getUtility("io.numberfield")

const NumberProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<NumberField
		value={valueAPI.get(path)}
		label={descriptor.label}
		setValue={(value: number | null): void => valueAPI.set(path, value)}
		context={context}
	/>
)

export default NumberProp
