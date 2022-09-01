import { builder, component } from "@uesio/ui"

const SelectField = component.getUtility("uesio/io.selectfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const SelectProp: builder.PropComponent<builder.SelectProp> = ({
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
		<SelectField
			value={valueAPI.get(path)}
			setValue={(value: string) => valueAPI.set(path, value)}
			options={descriptor.options}
			context={context}
			variant="uesio/studio.propfield"
		/>
	</FieldWrapper>
)

export default SelectProp
