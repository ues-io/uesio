import { context, signal } from "@uesio/ui"
import { TableState } from "./tabledefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: (
			signal: signal.SignalDefinition,
			ctx: context.Context
		) => async (
			setState: (state: TableState) => void,
			getState: () => TableState
		) => {
			const state = getState()
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
			return ctx
		},
	},
}

export default sigHandler
