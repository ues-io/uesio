import { component, definition } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface TextAreaProps {
	label: string
	path: FullPath
}

const TextAreaProp: definition.UtilityComponent<TextAreaProps> = ({
	context,
	path,
	label,
}) => {
	const TextAreaField = component.getUtility("uesio/io.textareafield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="top"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<TextAreaField
				variant="uesio/io.field:uesio/builder.propfield"
				value={get(context, path)}
				setValue={(value: string) => set(context, path, value)}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default TextAreaProp
