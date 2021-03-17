import { DialogState } from "./dialogdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: () => (state: DialogState) => ({
			mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
		}),
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
