import { builder, component } from "@uesio/ui"

const SelectProp: builder.PropComponent<builder.SelectProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const SelectField = component.getUtility("uesio/io.selectfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<SelectField
				value={valueAPI.get(path)}
				setValue={(value: string) => valueAPI.set(path, value)}
				options={descriptor.options}
				context={context}
				variant="uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default SelectProp
