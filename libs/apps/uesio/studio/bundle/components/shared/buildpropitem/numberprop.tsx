import { component, builder } from "@uesio/ui"

const NumberField = component.getUtility("uesio/io.numberfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const NumberProp: builder.PropComponent<builder.NumberProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper
		labelPosition="left"
		label={descriptor.label}
		context={context}
		variant="uesio/studio.propfield"
	>
		<NumberField
			value={valueAPI.get(path)}
			setValue={(value: number | null): void => valueAPI.set(path, value)}
			context={context}
			variant="uesio/io.textfield:uesio/studio.propfield"
		/>
	</FieldWrapper>
)

export default NumberProp
