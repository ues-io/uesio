import { signal } from "@uesio/ui"
import { TableState } from "./tabledefinition"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as TableState
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default signals
