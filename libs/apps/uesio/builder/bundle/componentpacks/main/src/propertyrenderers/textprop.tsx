import { component, definition } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"

interface TextProps {
	label: string
	path: FullPath
}

const TextProp: definition.UtilityComponent<TextProps> = ({
	context,
	path,
	label,
}) => {
	const TextField = component.getUtility("uesio/io.textfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	return (
		<FieldWrapper
			labelPosition="left"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<TextField
				variant="uesio/io.field:uesio/builder.propfield"
				value={get(context, path)}
				setValue={(value: string) => set(context, path, value)}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default TextProp
