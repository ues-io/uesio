import React, { FunctionComponent } from "react"
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
	return (
		<ActionButton
			title={action.label}
			onClick={(): void => {
				const componentKey = action.componentKey
				const [namespace, name] = component.path.parseKey(componentKey)

				const propDef = component.registry.getPropertiesDefinition(
					namespace,
					name
				)

				if (propDef) {
					uesio.view.addDefinition(
						`${props.path}["${action.slot}"]`,
						{
							[componentKey]: propDef.defaultDefinition(),
						}
					)
				}
			}}
			icon={AddIcon}
		/>
	)
}

export default AddAction
