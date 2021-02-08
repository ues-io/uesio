import { context, signal } from "@uesio/ui"
import { DeckState } from "../deck/deckdefinition"
import { FormState } from "../form/formdefinition"
import { TableState } from "../table/tabledefinition"

type State = DeckState | FormState | TableState

const sigHandler = {
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: State) => void,
			getState: () => State
		) => {
			const state = getState()
			setState({
				mode: state.mode === "READ" ? "EDIT" : "READ",
			})
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
}

export default sigHandler
