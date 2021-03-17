import { DeckState } from "./deckdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: () => (state: DeckState) => ({
			mode: state.mode === "READ" ? "EDIT" : "READ",
		}),
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
