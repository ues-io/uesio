import { FunctionComponent } from "react"
import { builder, hooks, signal, definition, component, wire } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const ToggleConditionAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, valueAPI } = props

	const def = valueAPI.get(path) as definition.DefinitionMap
	console.log({ def })

	//["wires"]["accounts"]["conditions"]["0"]["conditions"]["0"]

	const pathArray = component.path.toPath(path)
	if (!pathArray) return null

	const wireName = component.path.getKeyAtPath(pathArray[1])
	const wire = uesio.wire.useWire(wireName || "")

	if (!wire || !wireName) {
		return null
	}

	pathArray.splice(0, 3)
	const condition = wire.getCondition(
		component.path.fromPath(pathArray)
	) as wire.WireConditionState
	console.log({ condition })

	const signals: signal.SignalDefinition[] = [
		{
			signal: "wire/TOGGLE_CONDITION",
			wire: wireName,
			path,
		},
		{
			signal: "wire/LOAD",
			wires: [wireName],
		},
	]

	const clickHandler =
		signals && signals.length && uesio.signal.getHandler(signals)

	const action = props.action as builder.AddAction
	if (!action || !clickHandler) {
		return null
	}
	return (
		<ActionButton
			className="root"
			title={action.label}
			onClick={clickHandler}
			icon={condition.active ? "visibility_off" : "visibility"}
			context={props.context}
		/>
	)
}

export default ToggleConditionAction
