import { signal } from "@uesio/ui"
import { toggleMode } from "../../shared/mode"
import { nextPage, prevPage } from "../../shared/pagination"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	NEXT_PAGE: nextPage,
	PREV_PAGE: prevPage,
}

export default signals
