import { FunctionComponent } from "react"
import { builder, hooks, signal, definition, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const ToggleConditionAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const path = props.path || ""

	const def = uesio.view.useDefinition(props.path) as definition.DefinitionMap
	const wirePath = component.path.trimPathToComponent(path)
	const wireName = component.path.getKeyAtPath(wirePath)

	const wire = uesio.wire.useWire(wireName || "")

	const conditionId = def.id as string

	if (!wireName || !conditionId || !wire) {
		return null
	}

	const condition = wire.getCondition(conditionId)

	const signals: signal.SignalDefinition[] = [
		{
			signal: "wire/TOGGLE_CONDITION",
			wire: wireName,
			conditionId,
		},
		{
			signal: "wire/LOAD",
			wires: [wireName],
		},
	]

	const clickHandler =
		signals && signals.length && uesio.signal.getHandler(signals)

	const action = props.action as builder.AddAction
	if (!action || !clickHandler || !condition) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={clickHandler}
			icon={condition.active ? "visibility_off" : "visibility"}
		/>
	)
}

export default ToggleConditionAction
