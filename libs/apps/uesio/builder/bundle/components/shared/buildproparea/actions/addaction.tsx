import { FunctionComponent } from "react"
import { builder, component, metadata } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const AddAction: FunctionComponent<ActionProps<builder.AddAction>> = (
	props
) => {
	const action = props.action

	if (!action) {
		return null
	}

	const onClickHandler = (): void => {
		const { registry } = component
		const componentKey = action.componentKey as metadata.MetadataKey
		const propDef = registry.getPropertiesDefinition(componentKey)
		if (!propDef)
			throw new Error(`no propdef found in registry for: ${componentKey}`)

		props.valueAPI.add(`${props.path}["${action.slot}"]`, {
			[componentKey]: propDef.defaultDefinition(),
		})
	}

	return (
		<ActionButton
			title={action.label}
			onClick={onClickHandler}
			icon="add"
			context={props.context}
		/>
	)
}

export default AddAction
