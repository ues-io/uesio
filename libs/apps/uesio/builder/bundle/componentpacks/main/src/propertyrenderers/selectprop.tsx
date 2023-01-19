import { builder, component, definition } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface SelectProps {
	label: string
	path: FullPath
	options: builder.PropertySelectOption[]
}

const SelectProp: definition.UtilityComponent<SelectProps> = ({
	context,
	path,
	label,
	options,
}) => {
	const SelectField = component.getUtility("uesio/io.selectfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<SelectField
				value={get(context, path)}
				setValue={(value: string) => set(context, path, value)}
				options={options}
				context={context}
				variant="uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default SelectProp
