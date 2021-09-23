import { FunctionComponent } from "react"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends builder.PropRendererProps {
	descriptor: builder.SelectProp
}

const SelectField = component.registry.getUtility("io.selectfield")

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<SelectField
		value={valueAPI.get(path)}
		label={descriptor.label}
		setValue={(value: string) => valueAPI.set(path, value)}
		options={descriptor.options}
		context={context}
	/>
)

export default SelectProp
