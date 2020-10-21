import React, { ReactElement } from "react"
import { builder, hooks, signal, definition } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import SignalsIcon from "@material-ui/icons/Router"

function RunSignalsAction(props: ActionProps): ReactElement | null {
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
		></ActionButton>
	)
}

export default RunSignalsAction
