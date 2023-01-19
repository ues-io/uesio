import { builder, definition, component } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface MultiSelectProps {
	label: string
	path: FullPath
	options: builder.PropertySelectOption[]
}

const MultiSelectProp: definition.UtilityComponent<MultiSelectProps> = ({
	context,
	path,
	label,
	options,
}) => {
	const MultiSelectField = component.getUtility("uesio/io.multiselectfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<MultiSelectField
				value={get(context, path)}
				setValue={(value: string) => set(context, path, value)}
				options={options}
				context={context}
				variant="uesio/builder.propfield"
			/>
		</FieldWrapper>
	)
}

export default MultiSelectProp
