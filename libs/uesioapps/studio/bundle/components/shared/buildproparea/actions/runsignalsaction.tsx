import { FunctionComponent } from "react"
import { builder, hooks, signal, definition } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const RunSignalsAction: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, context, getValue } = props

	const def = getValue(path || "") as definition.DefinitionMap

	const action = props.action as builder.RunSignalsAction

	const slot = action?.slot || "signals"
	const signals = def?.[slot] as signal.SignalDefinition[]

	if (!action || !signals) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={uesio.signal.getHandler(signals)}
			icon="router"
			context={context}
		/>
	)
}

export default RunSignalsAction
