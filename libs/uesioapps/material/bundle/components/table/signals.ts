import signals from "../utils/signals"
import { TableState } from "./tabledefinition"

export default signals<TableState>((state: TableState) => ({
	mode: state.mode === "READ" ? "EDIT" : "READ",
}))
