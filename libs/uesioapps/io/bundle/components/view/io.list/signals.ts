import { signal } from "@uesio/ui"
import { modeDispatcher } from "../../shared/mode"

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: modeDispatcher,
}

export default signals
