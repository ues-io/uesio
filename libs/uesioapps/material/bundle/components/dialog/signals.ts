import signals from "../../utils/signals"
import { DialogState } from "./dialogdefinition"

export default signals<DialogState>((state) => ({
	mode: state.mode === "OPEN" ? "CLOSE" : "OPEN",
}))
