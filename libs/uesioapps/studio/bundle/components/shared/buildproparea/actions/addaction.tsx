import { FunctionComponent } from "react"
import { hooks, builder, component } from "@uesio/ui"
import AddIcon from "@material-ui/icons/Add"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const AddAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)

	const action = props.action as builder.AddAction
	if (!action) {
		return null
	}

	const onClickHandler = (): void => {
		const { registry } = component
		const componentKey = action.componentKey
		const propDef = registry.getPropertiesDefinition(componentKey)

		if (propDef) {
			uesio.view.addDefinition(`${props.path}["${action.slot}"]`, {
				[componentKey]: propDef.defaultDefinition(),
			})
		}
	}

	return (
		<ActionButton
			title={action.label}
			onClick={onClickHandler}
			icon={AddIcon}
		/>
	)
}

export default AddAction
