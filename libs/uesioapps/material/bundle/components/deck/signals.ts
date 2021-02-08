import signals from "../utils/signals"
import { DeckState } from "./deckdefinition"

export default signals<DeckState>((state) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
