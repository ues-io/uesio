import { context, signal } from "@uesio/ui"
import { DeckState } from "./deckdefinition"

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: DeckState) => void,
			getState: () => DeckState
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
