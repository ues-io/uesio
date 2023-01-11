import { component, builder } from "@uesio/ui"

const NumberProp: builder.PropComponent<builder.NumberProp> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => {
	const NumberField = component.getUtility("uesio/io.numberfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<NumberField
				value={valueAPI.get(path)}
				setValue={(value: number | null): void =>
					valueAPI.set(path, value)
				}
				context={context}
				variant="uesio/io.field:uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default NumberProp
