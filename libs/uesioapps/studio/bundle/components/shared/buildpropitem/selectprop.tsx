import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { builder, component } from "@uesio/ui"

interface SelectPropRendererProps extends PropRendererProps {
	descriptor: builder.SelectProp
}

const SelectField = component.registry.getUtility("io.selectfield")

const SelectProp: FunctionComponent<SelectPropRendererProps> = ({
	descriptor,
	setValue,
	getValue,
	context,
}) => (
	<SelectField
		value={getValue()}
		label={descriptor.label}
		setValue={setValue}
		options={descriptor.options}
		context={context}
	/>
)

export default SelectProp
