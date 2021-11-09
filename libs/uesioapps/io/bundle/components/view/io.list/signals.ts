import { signal } from "@uesio/ui"
import { toggleMode } from "../../shared/mode"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
}

export default signals
