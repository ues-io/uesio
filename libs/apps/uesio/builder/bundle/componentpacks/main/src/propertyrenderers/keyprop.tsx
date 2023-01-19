import { component, definition } from "@uesio/ui"
import { changeKey } from "../api/defapi"
import { FullPath } from "../api/path"

interface KeyProps {
	label: string
	path: FullPath
}

const KeyProp: definition.UtilityComponent<KeyProps> = (props) => {
	const TextField = component.getUtility("uesio/io.textfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const { path, context, label } = props
	if (!path) return null
	const [key] = path.pop()
	return (
		<FieldWrapper
			labelPosition="left"
			label={label}
			context={context}
			variant="uesio/builder.propfield"
		>
			<TextField
				variant="uesio/io.field:uesio/builder.propfield"
				value={key}
				setValue={(value: string): void =>
					changeKey(context, path, value)
				}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default KeyProp
