import { FunctionComponent } from "react"
import { hooks, signal, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const LoadWireAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, action, context } = props
	const wireName = component.path.getKeyAtPath(path || "")

	if (!action || !wireName) {
		return null
	}

	const signals: signal.SignalDefinition[] = [
		{
			signal: "wire/LOAD",
			wires: [wireName],
		},
	]
	return (
		<ActionButton
			title={action.label}
			onClick={uesio.signal.getHandler(signals)}
			icon="refresh"
			context={context}
		/>
	)
}

export default LoadWireAction
