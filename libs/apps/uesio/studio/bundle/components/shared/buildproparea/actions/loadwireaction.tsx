import { FunctionComponent } from "react"
import { hooks, signal, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const LoadWireAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, action, context } = props
	const wireName = component.path.getKeyAtPath(path || "")
	const viewDef = uesio.view.useViewDef(context.getViewDefId() || "")
	if (!action || !wireName) {
		return null
	}

	const onClick = () => {
		const wireDef = viewDef?.wires?.[wireName]
		const signals: signal.SignalDefinition[] = [
			{
				signal: "wire/INIT",
				wires: [wireName],
				wireDefs: [wireDef || {}],
			},
			{
				signal: "wire/LOAD",
				wires: [wireName],
			},
		]
		uesio.signal.getHandler(signals)
	}

	return (
		<ActionButton
			title={"Refresh Wire"}
			onClick={() => onClick()}
			icon="refresh"
			context={context}
		/>
	)
}

export default LoadWireAction
