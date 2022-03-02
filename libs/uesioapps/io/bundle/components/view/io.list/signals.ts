import { signal } from "@uesio/ui"
import { toggleMode, setEdit, setRead } from "../../shared/mode"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_READ: setRead,
	SET_EDIT: setEdit,
}

export default signals
