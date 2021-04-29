import { ListState } from "./listdefinition"

export default {
	TOGGLE_MODE: {
		dispatcher: () => (state: ListState) => ({
			mode: state.mode === "READ" ? "EDIT" : "READ",
		}),
		label: "Toggle Mode",
		properties: () => [],
	},
}
