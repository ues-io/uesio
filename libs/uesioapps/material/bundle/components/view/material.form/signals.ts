import { FormState } from "./formdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: () => (state: FormState) => ({
			mode: state.mode === "READ" ? "EDIT" : "READ",
		}),
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
