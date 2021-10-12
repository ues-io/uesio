import { signal } from "@uesio/ui"
import { FormState } from "./formdefinition"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: {
		dispatcher: (signal, context, getState, setState) => {
			const state = getState() as FormState
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default signals
