import { context, signal } from "@uesio/ui"
import { FormState } from "./formdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: FormState) => void,
			getState: () => FormState
		) => {
			const state = getState()
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
