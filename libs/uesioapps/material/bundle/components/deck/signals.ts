import signals from "../utils/signals"
import { DeckState } from "./deckdefinition"

export default signals<DeckState>((state: DeckState) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
