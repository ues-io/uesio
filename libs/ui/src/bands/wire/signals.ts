import { BandSignal } from "../../definition/signal"
import { WireDefinitionMap } from "../../wireexports"

const LOAD = "LOAD"
const SAVE = "SAVE"
const ADD_WIRES = "ADD_WIRES"

interface LoadSignal extends BandSignal {
	signal: typeof LOAD
	targets: string[]
}

interface SaveSignal extends BandSignal {
	signal: typeof SAVE
	targets: string[]
}

interface AddWiresSignal extends BandSignal {
	signal: typeof ADD_WIRES
	defs: WireDefinitionMap
}

export { LOAD, SAVE, LoadSignal, SaveSignal, AddWiresSignal }
