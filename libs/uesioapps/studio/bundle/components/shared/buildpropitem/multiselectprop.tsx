import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends PropRendererProps {
	descriptor: builder.SelectProp
}

const MultiSelectField = component.registry.getUtility("io.multiselectfield")

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
	descriptor,
	valueAPI,
	context,
	path,
}) => (
	<MultiSelectField
		value={valueAPI.get(path)}
		label={descriptor.label}
		setValue={(value: string) => valueAPI.set(path, value)}
		options={descriptor.options}
		context={context}
	/>
)

export default SelectProp
