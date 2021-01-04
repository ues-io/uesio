import React, { FunctionComponent } from "react"
import { builder, hooks, signal, definition } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import SignalsIcon from "@material-ui/icons/Router"

const RunSignalsAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)

	const def = uesio.view.useDefinition(props.path) as definition.DefinitionMap
	const action = props.action as builder.RunSignalsAction

	const slot = action?.slot || "signals"
	const signals = slot
		? (def?.[slot] as signal.SignalDefinition[])
		: undefined

	if (!action || !signals) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={uesio.signal.getHandler(signals)}
			icon={SignalsIcon}
		/>
	)
}

export default RunSignalsAction
