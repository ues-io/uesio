import { TableState } from "./tabledefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: () => (state: TableState) => ({
			mode: state.mode === "READ" ? "EDIT" : "READ",
		}),
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
