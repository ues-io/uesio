import { context, signal } from "@uesio/ui"
import { DeckState } from "../deck/deckdefinition"
import { FormState } from "../form/formdefinition"
import { TableState } from "../table/tabledefinition"
import { DialogState } from "../dialog/dialogdefinition"

type State = DeckState | FormState | TableState | DialogState
type Payload = (state: State) => State

const sigHandler = (payload: Payload) => ({
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: State) => void,
			getState: () => State
		) => {
			setState(payload(getState()))
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
})

export default (payload: Payload) => sigHandler(payload)
