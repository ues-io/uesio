import { BandSignal } from "../definition/signal"

const LOAD = "LOAD"
const SAVE = "SAVE"
const CANCEL = "CANCEL"

interface LoadSignal extends BandSignal {
	signal: typeof LOAD
	name: string
	namespace: string
}

interface SaveSignal extends BandSignal {
	signal: typeof SAVE
}

interface CancelSignal extends BandSignal {
	signal: typeof CANCEL
}

export { LoadSignal, SaveSignal, CancelSignal, LOAD, SAVE, CANCEL }
