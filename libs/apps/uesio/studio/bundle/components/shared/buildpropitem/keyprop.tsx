import { FunctionComponent } from "react"
import { component, builder } from "@uesio/ui"

const TextField = component.registry.getUtility("uesio/io.textfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const KeyProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { path, descriptor, context, valueAPI } = props
	if (!path) return null
	const key = component.path.getKeyAtPath(path)
	return (
		<FieldWrapper
			labelPosition="left"
			label={descriptor.label}
			context={context}
			variant="uesio/studio.propfield"
		>
			<TextField
				variant="uesio/studio.propfield"
				value={key}
				setValue={(value: string): void =>
					valueAPI.changeKey(path, value)
				}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default KeyProp
