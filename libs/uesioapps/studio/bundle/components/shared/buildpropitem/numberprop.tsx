import { FunctionComponent } from "react"

import { component, builder } from "@uesio/ui"

const NumberField = component.registry.getUtility("io.numberfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")

const NumberProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper label={descriptor.label} context={context}>
		<NumberField
			value={valueAPI.get(path)}
			setValue={(value: number | null): void => valueAPI.set(path, value)}
			context={context}
		/>
	</FieldWrapper>
)

export default NumberProp
