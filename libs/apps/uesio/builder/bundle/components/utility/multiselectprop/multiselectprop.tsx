import { builder, component } from "@uesio/ui"

const MultiSelectField = component.getUtility("uesio/io.multiselectfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const MultiSelectProp: builder.PropComponent<builder.MultiSelectProp> = ({
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
		<MultiSelectField
			value={valueAPI.get(path)}
			setValue={(value: string) => valueAPI.set(path, value)}
			options={descriptor.options}
			context={context}
			variant="uesio/studio.propfield"
		/>
	</FieldWrapper>
)

export default MultiSelectProp
