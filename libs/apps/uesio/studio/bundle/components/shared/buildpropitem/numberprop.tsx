import { FunctionComponent } from "react"

import { component, builder } from "@uesio/ui"

const NumberField = component.registry.getUtility("uesio/io.numberfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const NumberProp: FunctionComponent<builder.PropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper
		labelPosition="left"
		label={descriptor.label}
		context={context}
		variant="studio.propfield"
	>
		<NumberField
			value={valueAPI.get(path)}
			setValue={(value: number | null): void => valueAPI.set(path, value)}
			context={context}
			variant="io.textfield.studio.propfield"
		/>
	</FieldWrapper>
)

export default NumberProp
