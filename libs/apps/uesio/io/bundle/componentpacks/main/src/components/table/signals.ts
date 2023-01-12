import { signal } from "@uesio/ui"
import { toggleMode, setEditMode, setReadMode } from "../../shared/mode"
import { nextPage, prevPage } from "../../shared/pagination"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_EDIT_MODE: setEditMode,
	SET_READ_MODE: setReadMode,
	NEXT_PAGE: nextPage,
	PREV_PAGE: prevPage,
}

export default signals
