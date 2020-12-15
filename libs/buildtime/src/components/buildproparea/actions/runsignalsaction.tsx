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

	const clickHandler = signals && uesio.signal.getHandler(signals)

	if (!action || !signals) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={clickHandler}
			icon={SignalsIcon}
		/>
	)
}

export default RunSignalsAction
