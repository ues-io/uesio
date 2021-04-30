import { signal } from "@uesio/ui"
import { ListState } from "./listdefinition"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as ListState
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default signals
