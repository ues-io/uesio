import { FunctionComponent } from "react"
import { builder, hooks, signal, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import RefreshIcon from "@material-ui/icons/Refresh"

const LoadWireAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const path = props.path
	const wireName = component.path.getKeyAtPath(path)

	if (!wireName) {
		return null
	}

	const signals: signal.SignalDefinition[] = [
		{
			signal: "wire/LOAD",
			wires: [wireName],
		},
	]

	const action = props.action as builder.AddAction
	if (!action || !signals) {
		return null
	}

	return (
		<ActionButton
			title={action.label}
			onClick={uesio.signal.getHandler(signals)}
			icon={RefreshIcon}
		/>
	)
}

export default LoadWireAction
