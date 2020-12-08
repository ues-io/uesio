import React, { ReactElement } from "react"
import { builder, hooks, signal, definition, component } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import RefreshIcon from "@material-ui/icons/Refresh"

function LoadWireAction(props: ActionProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const path = props.path
	const def = uesio.view.useDefinition(path) as definition.DefinitionMap
	const wireName = component.path.getKeyAtPath(path)

	if (!wireName) {
		return null
	}

	const signals: signal.SignalDefinition[] = [
		{
			band: "",
			signal: "wire/LOAD",
			wires: [wireName],
		},
	]

	const clickHandler = signals && uesio.signal.getHandler(signals)

	const action = props.action as builder.AddAction
	if (!action || !signals) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={clickHandler}
			icon={RefreshIcon}
		/>
	)
}

export default LoadWireAction
