import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends builder.PropRendererProps {
	descriptor: builder.SelectProp
}

const SelectField = component.registry.getUtility("io.selectfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<FieldWrapper label={descriptor.label} context={context}>
		<SelectField
			value={valueAPI.get(path)}
			setValue={(value: string) => valueAPI.set(path, value)}
			options={descriptor.options}
			context={context}
		/>
	</FieldWrapper>
)

export default SelectProp
