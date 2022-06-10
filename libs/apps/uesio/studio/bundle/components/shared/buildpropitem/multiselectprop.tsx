import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends builder.PropRendererProps {
	descriptor: builder.SelectProp
}

const MultiSelectField = component.getUtility("uesio/io.multiselectfield")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const MultiSelectProp: FunctionComponent<SelectPropRendererProps> = ({
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
