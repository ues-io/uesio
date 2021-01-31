import { context, signal } from "@uesio/ui"
import { DialogState } from "./dialogdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: DialogState) => void,
			getState: () => DialogState
		) => {
			const state = getState()
			setState({
				mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
			})
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
