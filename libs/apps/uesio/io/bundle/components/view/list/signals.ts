import { signal } from "@uesio/ui"
import { toggleMode, setEditMode, setReadMode } from "../../shared/mode"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ_MODE: setReadMode,
	SET_EDIT_MODE: setEditMode,
}

export default signals
