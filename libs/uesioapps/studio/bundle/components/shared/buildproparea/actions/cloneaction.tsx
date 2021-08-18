import { FunctionComponent } from "react"
import { hooks, builder, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const CloneAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path = "", valueAPI, context } = props

	const action = props.action as builder.CloneAction
	if (!action) {
		return null
	}

	const onClickHandler = (): void => {
		const { registry } = component
		const componentKey = action.componentKey
		const propDef = registry.getPropertiesDefinition(componentKey)

		if (propDef) {
			valueAPI.clone(path)
		}
	}

	return (
		<ActionButton
			title={action.label}
			onClick={onClickHandler}
			icon="copy"
			context={props.context}
		/>
	)
}

export default CloneAction
