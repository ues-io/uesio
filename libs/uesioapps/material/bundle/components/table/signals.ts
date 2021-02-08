import signals from "../../utils/signals"
import { TableState } from "./tabledefinition"

export default signals<TableState>((state) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
