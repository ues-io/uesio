import { FunctionComponent } from "react"
import { builder, api, signal, definition } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"

const RunSignalsAction: FunctionComponent<
	ActionProps<builder.RunSignalsAction>
> = (props) => {
	const { path, context, valueAPI } = props

	const def = valueAPI.get(path) as definition.DefinitionMap

	const action = props.action

	const slot = action?.slot || "signals"
	const signals = def?.[slot] as signal.SignalDefinition[]

	if (!action || !signals) {
		return null
	}
	return (
		<ActionButton
			title={action.label}
			onClick={api.signal.getHandler(signals, context)}
			icon="router"
			context={context}
		/>
	)
}

export default RunSignalsAction
