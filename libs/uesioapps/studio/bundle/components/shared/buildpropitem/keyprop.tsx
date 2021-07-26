import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { component } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const KeyProp: FunctionComponent<PropRendererProps> = (props) => {
	const { path, descriptor, context, valueAPI } = props
	if (!path) return null
	const key = component.path.getKeyAtPath(path)
	// Fall back to text component
	return (
		<TextField
			value={key}
			label={descriptor.label}
			setValue={(value: string): void => valueAPI.changeKey(path, value)}
			context={context}
		/>
	)
}

export default KeyProp
