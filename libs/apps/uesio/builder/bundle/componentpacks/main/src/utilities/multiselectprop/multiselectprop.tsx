import { builder, component } from "@uesio/ui"

const MultiSelectProp: builder.PropComponent<builder.MultiSelectProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const MultiSelectField = component.getUtility("uesio/io.multiselectfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<MultiSelectField
				value={valueAPI.get(path)}
				setValue={(value: string) => valueAPI.set(path, value)}
				options={descriptor.options}
				context={context}
				variant="uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default MultiSelectProp
