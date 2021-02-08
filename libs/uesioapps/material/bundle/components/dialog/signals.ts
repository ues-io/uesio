import signals from "../utils/signals"
import { DialogState } from "./dialogdefinition"

export default signals<DialogState>((state: DialogState) => ({
	mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
}))
