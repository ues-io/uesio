import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, util, component } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")

const KeyProp: FunctionComponent<PropRendererProps> = (props) => {
	const { path, descriptor, context } = props
	const pathArray = util.toPath(path)
	const key = pathArray.pop()
	const uesio = hooks.useUesio(props)

	// Fall back to text component
	return (
		<TextField
			value={key}
			label={descriptor.label}
			setValue={(value: string): void =>
				uesio.view.changeDefinitionKey(path || "", value)
			}
			variant="io.default"
			context={context}
		/>
	)
}

export default KeyProp
