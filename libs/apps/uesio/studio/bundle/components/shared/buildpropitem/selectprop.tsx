import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends builder.PropRendererProps {
	descriptor: builder.SelectProp
}

const SelectField = component.getUtility("uesio/io.selectfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
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
