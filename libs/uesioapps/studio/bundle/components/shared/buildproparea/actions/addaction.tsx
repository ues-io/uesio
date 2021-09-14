import { FunctionComponent } from "react"
import { hooks, builder, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const AddAction: FunctionComponent<ActionProps> = (props) => {
	const action = props.action as builder.AddAction

	if (!action) {
		return null
	}

	const onClickHandler = (): void => {
		const { registry } = component
		const componentKey = action.componentKey
		const propDef = registry.getPropertiesDefinition(componentKey)

		console.log({ propDef })
		if (propDef) {
			props.valueAPI.add(`${props.path}["${action.slot}"]`, {
				[componentKey]: propDef.defaultDefinition(),
			})
		}
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
